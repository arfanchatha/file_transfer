import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Modal, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { FaGoogle, FaVideo, FaCloudUploadAlt, FaHistory, FaFolder, FaFolderOpen, FaInfoCircle, FaTimes, FaShieldAlt } from 'react-icons/fa';
import { useGoogleLogin } from '@react-oauth/google';
import Link from 'next/link';
import Head from 'next/head';

// API URL for Next.js API routes
const API_URL = '/api';
// Google API scopes needed
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

// Check if client ID is properly configured
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const isGoogleConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID';

export default function Home() {
  const [loomUrl, setLoomUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [folderName, setFolderName] = useState('Root folder');
  const [folderId, setFolderId] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [transferProgress, setTransferProgress] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  
  // Folder selection modal state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [currentParent, setCurrentParent] = useState(null);
  const [folderPath, setFolderPath] = useState([{ id: 'root', name: 'My Drive' }]);
  const [oauthError, setOauthError] = useState('');

  // Cancel confirmation modal state
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

  // Video details confirmation modal state
  const [showVideoDetailsModal, setShowVideoDetailsModal] = useState(false);
  const [videoDetails, setVideoDetails] = useState(null);
  const [loadingVideoDetails, setLoadingVideoDetails] = useState(false);

  // AbortController for cancelling requests
  const abortControllerRef = useRef(null);

  // Cleanup function to cancel ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingAuth = () => {
      const token = localStorage.getItem('googleAccessToken');
      const expiryTime = localStorage.getItem('tokenExpiryTime');
      const userInfoStr = localStorage.getItem('userInfo');
      
      if (token && expiryTime && new Date().getTime() < parseInt(expiryTime)) {
        setAccessToken(token);
        setIsAuthenticated(true);
        if (userInfoStr) {
          setUserInfo(JSON.parse(userInfoStr));
        }
      } else {
        // Clear expired tokens
        localStorage.removeItem('googleAccessToken');
        localStorage.removeItem('tokenExpiryTime');
        localStorage.removeItem('userInfo');
      }
    };
    
    checkExistingAuth();
  }, []);

  // Google login with proper OAuth
  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setIsLoading(true);
        setOauthError(''); // Clear any previous errors
        
        // Store the token in state and localStorage
        setAccessToken(codeResponse.access_token);
        localStorage.setItem('googleAccessToken', codeResponse.access_token);
        
        // Store token expiry time (usually 1 hour from now)
        const expiryTime = new Date().getTime() + (codeResponse.expires_in * 1000);
        localStorage.setItem('tokenExpiryTime', expiryTime.toString());
        
        // Get user info
        const userResponse = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${codeResponse.access_token}` } }
        );
        
        setUserInfo(userResponse.data);
        localStorage.setItem('userInfo', JSON.stringify(userResponse.data));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Login error:', error);
        setError('Failed to authenticate with Google');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      
      // Check for access_denied error (app not verified)
      if (error.error === 'access_denied') {
        setOauthError('access_denied');
        setError('');
      } else {
        setError('Google login failed');
      }
    },
    scope: SCOPES.join(' '),
    flow: 'implicit',
  });

  // Fetch Google Drive folders using direct API calls
  const fetchFolders = useCallback(async (parentId = 'root') => {
    if (!accessToken) return;
    
    setLoadingFolders(true);
    setError(''); // Clear previous errors
    
    try {
      console.log('Fetching folders with parentId:', parentId);
      
      // Use direct API call instead of gapi
      const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
        params: {
          q: `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
          fields: 'files(id, name)',
          orderBy: 'name'
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      console.log('Drive API response:', response.data);
      
      // Check if response has the expected structure
      if (response.data && Array.isArray(response.data.files)) {
        setFolders(response.data.files);
      } else {
        console.warn('Unexpected response format:', response.data);
        setFolders([]);
      }
      
      setCurrentParent(parentId);
    } catch (error) {
      console.error('Error fetching folders:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      let errorMessage = 'Failed to load folders from Google Drive';
      if (error.response?.data?.error?.message) {
        errorMessage = `Drive API error: ${error.response.data.error.message}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoadingFolders(false);
    }
  }, [accessToken]);

  // Open folder selection modal
  const openFolderSelector = async () => {
    setError(''); // Clear any previous errors
    
    // Check if permissions are valid before proceeding
    const hasPermissions = await verifyDrivePermissions();
    if (!hasPermissions) {
      return; // Don't open the modal if permissions are invalid
    }
    
    setShowFolderModal(true);
    setFolderPath([{ id: 'root', name: 'My Drive' }]);
    fetchFolders('root');
  };

  // Navigate to a subfolder
  const navigateToFolder = (folder) => {
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
    fetchFolders(folder.id);
  };

  // Navigate back in the folder path
  const navigateBack = (index) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    fetchFolders(newPath[newPath.length - 1].id);
  };

  // Select a folder
  const selectFolder = (folder) => {
    setFolderId(folder.id);
    setFolderName(folder.name);
    setShowFolderModal(false);
  };

  // Select root folder
  const selectRootFolder = () => {
    setFolderId('');
    setFolderName('Root folder');
    setShowFolderModal(false);
  };

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('tokenExpiryTime');
    localStorage.removeItem('userInfo');
    setAccessToken('');
    setIsAuthenticated(false);
    setUserInfo(null);
  }, []);

  // Handle transfer cancellation - show confirmation first
  const handleCancelTransfer = () => {
    setShowCancelConfirmModal(true);
  };

  // Actually cancel the transfer after confirmation
  const confirmCancelTransfer = () => {
    if (abortControllerRef.current) {
      console.log('User confirmed transfer cancellation');
      setIsCancelling(true);
      setTransferProgress('Cancelling transfer...');
      setShowCancelConfirmModal(false);
      
      // Abort the request
      abortControllerRef.current.abort();
      
      // Set immediate feedback
      setTimeout(() => {
        setStatus('');
        setError('Transfer cancelled by user');
        setTransferProgress('');
        setIsLoading(false);
        setIsCancelling(false);
        
        // Clear the abort controller
        abortControllerRef.current = null;
      }, 100); // Small delay to ensure abort signal is processed
    }
  };

  // Close cancel confirmation modal
  const closeCancelConfirmModal = () => {
    setShowCancelConfirmModal(false);
  };

  // Handle showing video details modal before transfer
  const handleShowVideoDetails = async (e) => {
    e.preventDefault();
    
    if (!loomUrl) {
      setError('Please enter a Loom URL');
      return;
    }

    // Validate Loom URL format
    if (!loomUrl.includes('loom.com')) {
      setError('Please enter a valid Loom share URL');
      return;
    }

    if (!accessToken) {
      setError('Please login with Google first');
      return;
    }

    setError('');
    setLoadingVideoDetails(true);

    try {
      console.log('Getting video details...');
      const response = await axios.post(`${API_URL}/video-details`, {
        loomUrl
      });

      if (response.data.success) {
        setVideoDetails(response.data.data);
        setShowVideoDetailsModal(true);
      } else {
        setError('Failed to get video details. Please check the URL and try again.');
      }
    } catch (err) {
      console.error('Error getting video details:', err);
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        'Failed to get video details';
      setError(errorMessage);
    } finally {
      setLoadingVideoDetails(false);
    }
  };

  // Handle confirming transfer from the modal
  const handleConfirmTransfer = () => {
    setShowVideoDetailsModal(false);
    handleTransfer();
  };

  // Handle form submission
  const handleTransfer = async (e) => {
    // If called from form submission, prevent default
    if (e) {
      e.preventDefault();
    }

    if (!loomUrl) {
      setError('Please enter a Loom URL');
      return;
    }

    // Validate Loom URL format
    if (!loomUrl.includes('loom.com')) {
      setError('Please enter a valid Loom share URL');
      return;
    }

    if (!accessToken) {
      setError('Please login with Google first');
      return;
    }

    setError('');
    setStatus('');
    setIsLoading(true);
    setIsCancelling(false);
    setTransferProgress('Initializing transfer...');

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // First verify Drive API permissions
      setTransferProgress('Verifying Google Drive permissions...');
      const hasPermissions = await verifyDrivePermissions();
      if (!hasPermissions) {
        // verifyDrivePermissions already sets an error message
        setIsLoading(false);
        setTransferProgress('');
        return;
      }

      console.log('Starting transfer to Google Drive...');
      setTransferProgress('Preparing Loom video and starting transfer...');
      const response = await axios.post(`${API_URL}/transfer`, {
        loomUrl,
        fileName: fileName || undefined,
        accessToken,
        folderId: folderId || undefined,
        userId: userInfo?.sub
      }, {
        signal: abortControllerRef.current.signal,
        timeout: 300000, // 5 minute timeout
        onUploadProgress: (progressEvent) => {
          // Update progress if possible
          if (progressEvent.loaded && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setTransferProgress(`Uploading to Google Drive... ${percent}%`);
          }
        }
      });

      console.log('Transfer response:', response.data);

      if (response.data.success) {
        // Show success with link to the file
        const fileLink = response.data.viewLink || `https://drive.google.com/file/d/${response.data.fileId}/view`;
        const actualFileName = response.data.fileName || 'video.mp4';
        
        // Format file size for display if available
        let fileSizeInfo = '';
        let fileSizeWarning = null;
        
        if (response.data.fileSize) {
          const sizeInBytes = parseInt(response.data.fileSize, 10);
          const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
          fileSizeInfo = ` (${sizeInMB} MB)`;
          
          // If file is suspiciously small (less than 100KB), show a warning
          if (sizeInBytes < 100000) {
            fileSizeWarning = (
              <Alert variant="warning" className="mt-2">
                <strong>Warning:</strong> The transferred file is very small ({sizeInMB} MB), which may indicate that only a 
                placeholder file was transferred, not the actual video. Please check the file in Google Drive.
              </Alert>
            );
          }
        }
        
        setStatus(
          <div>
            <p>Success! Video transferred to Google Drive as <strong>{actualFileName}</strong>{fileSizeInfo}</p>
            {fileSizeWarning}
            <p>
              <a 
                href={fileLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-sm btn-outline-primary"
              >
                View in Google Drive
              </a>
            </p>
          </div>
        );
        setLoomUrl('');
        setFileName('');
      } else {
        setError('Transfer failed. Please try again.');
      }
    } catch (err) {
      // Handle different types of errors
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        console.log('Transfer was cancelled by user');
        setError('Transfer cancelled by user');
        setTransferProgress('');
      } else {
        console.error('Transfer error:', err);
        
        // Get detailed error information
        const errorMessage = 
          err.response?.data?.message || 
          err.message || 
          'An error occurred during transfer';
        
        const errorDetails = err.response?.data?.error;
        
        // Set a user-friendly error message
        setError(
          <div>
            <p>{errorMessage}</p>
            {errorDetails && (
              <details className="mt-2 text-muted">
                <summary>Technical details</summary>
                <small>{errorDetails}</small>
              </details>
            )}
          </div>
        );
        setTransferProgress('');
      }
    } finally {
      setIsLoading(false);
      setIsCancelling(false);
      setTransferProgress('');
      abortControllerRef.current = null;
    }
  };

  // Folder selection modal
  const folderSelectionModal = (
    <Modal show={showFolderModal} onHide={() => setShowFolderModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Select Google Drive Folder</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Folder navigation breadcrumb */}
        <div className="folder-path mb-3">
          {folderPath.map((folder, index) => (
            <span key={folder.id}>
              {index > 0 && " > "}
              <Button 
                variant="link" 
                className="p-0 text-decoration-none" 
                onClick={() => navigateBack(index)}
              >
                {folder.name}
              </Button>
            </span>
          ))}
        </div>
        
        {/* Root folder option */}
        <ListGroup className="mb-3">
          <ListGroup.Item 
            action
            className="d-flex align-items-center"
            onClick={selectRootFolder}
          >
            <FaFolder className="me-2 text-primary" />
            <span>Root folder (My Drive)</span>
          </ListGroup.Item>
        </ListGroup>
        
        {/* Folders list */}
        {loadingFolders ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Loading folders...</p>
          </div>
        ) : folders.length === 0 ? (
          <Alert variant="info">No folders found in this location</Alert>
        ) : (
          <ListGroup>
            {folders.map(folder => (
              <ListGroup.Item 
                key={folder.id} 
                action
                className="d-flex align-items-center justify-content-between"
              >
                <div className="d-flex align-items-center">
                  <FaFolder className="me-2 text-primary" />
                  <span>{folder.name}</span>
                </div>
                <div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="me-2"
                    onClick={() => navigateToFolder(folder)}
                  >
                    Open
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => selectFolder(folder)}
                  >
                    Select
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowFolderModal(false)}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Cancel confirmation modal
  const cancelConfirmationModal = (
    <Modal 
      show={showCancelConfirmModal} 
      onHide={closeCancelConfirmModal} 
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FaTimes className="text-danger me-2" />
          Cancel Transfer
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center">
          <FaInfoCircle className="text-warning mb-3" size={48} />
          <h5>Are you sure you want to cancel the transfer?</h5>
          <p className="text-muted">
            The video transfer will be stopped immediately and any progress will be lost.
            You'll need to start over if you want to transfer this video.
          </p>
          <div className="mt-3">
            <small className="text-muted">
              <strong>Tip:</strong> You can also press Escape to continue the transfer
            </small>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeCancelConfirmModal}>
          Continue Transfer
        </Button>
        <Button variant="danger" onClick={confirmCancelTransfer} autoFocus>
          <FaTimes className="me-2" />
          Yes, Cancel Transfer
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Add a new ConfigurationMessage component
  const ConfigurationMessage = () => (
    <Alert variant="warning" className="mt-4">
      <h5><FaInfoCircle className="me-2" />Google OAuth Configuration Required</h5>
      <p>To use this application, you need to configure your Google OAuth credentials:</p>
      <ol>
        <li>Create a project in the <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
        <li>Enable the Google Drive API for your project</li>
        <li>Configure the OAuth consent screen (select "External")</li>
        <li>Create OAuth 2.0 credentials (Web application type)</li>
        <li>Add <code>http://localhost:3000 || your-domain.com</code> to Authorized JavaScript origins and redirect URIs</li>
        <li>Create a <code>.env.local</code> file in the root folder with:
          <pre className="mt-2 p-2 bg-light">
            NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here{'\n'}
            NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key-here
          </pre>
        </li>
        <li>Restart the development server</li>
      </ol>
      <p>See the README.md file for detailed instructions.</p>
    </Alert>
  );

  // Add a new component for OAuth errors
  const OAuthErrorMessage = () => {
    if (oauthError === 'access_denied') {
      return (
        <Alert variant="warning" className="mt-3">
          <h5><FaInfoCircle className="me-2" />Testing Mode: User Access Required</h5>
          <p>Your app is in testing mode and your email was not found in the list of test users.</p>
          <hr />
          <ol className="mb-0">
            <li>Go to the <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
            <li>Select your project</li>
            <li>Go to "OAuth consent screen"</li>
            <li>Scroll down to "Test users"</li>
            <li>Click "ADD USERS" and add your email address</li>
            <li>Save the changes and wait a few minutes</li>
            <li>Try logging in again</li>
          </ol>
          <hr />
          <p className="mb-0">See <code>SETUP_GOOGLE_OAUTH.md</code> for more details.</p>
        </Alert>
      );
    }
    return null;
  };

  // Add a function to verify Drive API permissions
  const verifyDrivePermissions = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      console.log('Verifying Drive API permissions...');
      
      // Make a basic request to check permissions
      const response = await axios.get(
        'https://www.googleapis.com/drive/v3/about?fields=user',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      console.log('Drive API permissions verified:', response.data);
      return true;
    } catch (error) {
      console.error('Drive API permission error:', error);
      
      // Check for scope issues
      if (error.response?.status === 403) {
        setError('Missing required Google Drive permissions. Please check the scopes in your Google Cloud Console.');
      } else if (error.response?.status === 401) {
        setError('Google authentication expired. Please log in again.');
        handleLogout();
      }
      
      return false;
    }
  }, [accessToken, handleLogout]);
  
  // Call permission check when user logs in
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      verifyDrivePermissions();
    }
  }, [isAuthenticated, accessToken, verifyDrivePermissions]);

  return (
    <>
      <Head>
        <title>Loom to Google Drive Transfer</title>
        <meta name="description" content="Transfer your Loom videos directly to Google Drive without downloading" />
        <link rel="icon" href="/assets/filelift.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Container className="py-5">
        <Row className="mb-4">
          <Col>
            <h1 className="text-center mb-4">
              <FaVideo className="me-2" />
              Loom to Google Drive Transfer
            </h1>
            <p className="text-center text-muted">
              Transfer your Loom videos directly to Google Drive without downloading
            </p>
          </Col>
        </Row>

        {!isGoogleConfigured && <ConfigurationMessage />}

        {isGoogleConfigured && !isAuthenticated ? (
          <Row className="justify-content-center">
            <Col md={6}>
              <Card className="shadow-sm">
                <Card.Body className="text-center p-5">
                  <h3 className="mb-4">Get Started</h3>
                  <p>Login with Google to access your Drive</p>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={() => login()}
                    disabled={isLoading}
                    className="d-flex align-items-center justify-content-center mx-auto"
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <FaGoogle className="me-2" /> Login with Google
                      </>
                    )}
                  </Button>
                  
                  {/* Add the OAuth error message */}
                  {oauthError && <OAuthErrorMessage />}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : isGoogleConfigured ? (
          <Row>
            <Col lg={8} className="mx-auto">
              <Card className="shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="mb-0">Transfer Video</h3>
                    <div className="d-flex align-items-center">
                      {userInfo && (
                        <div className="me-3 d-flex align-items-center">
                          {userInfo.picture && (
                            <img 
                              src={userInfo.picture} 
                              alt={userInfo.name} 
                              className="rounded-circle me-2" 
                              style={{ width: '32px', height: '32px' }} 
                            />
                          )}
                          <span className="d-none d-md-inline">{userInfo.name}</span>
                        </div>
                      )}
                      <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
                        Logout
                      </Button>
                    </div>
                  </div>

                  {error && <Alert variant="danger">{error}</Alert>}
                  {status && <Alert variant="success">{status}</Alert>}

                  <Form onSubmit={handleShowVideoDetails}>
                    <Form.Group className="mb-3">
                      <Form.Label>Loom Video URL</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="https://www.loom.com/share/..."
                        value={loomUrl}
                        onChange={(e) => setLoomUrl(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">
                        Paste the share link from Loom
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>File Name (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Will use original Loom title if empty"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        Leave empty to use the original Loom video title
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Google Drive Folder</Form.Label>
                      <div className="d-flex">
                        <Form.Control
                          type="text"
                          placeholder="Selected folder"
                          value={folderName}
                          disabled
                          className="me-2"
                        />
                        <Button 
                          variant="outline-primary" 
                          onClick={openFolderSelector}
                          className="d-flex align-items-center"
                        >
                          <FaFolderOpen className="me-2" />
                          Browse
                        </Button>
                      </div>
                      <Form.Text className="text-muted">
                        Select where to save your video in Google Drive
                      </Form.Text>
                    </Form.Group>

                    <div className="d-grid">
                      {isLoading ? (
                        <div className="d-flex gap-2">
                          <Button 
                            variant="primary" 
                            disabled
                            className="flex-grow-1"
                          >
                            <Spinner animation="border" size="sm" className="me-2" />
                            {transferProgress || 'Transferring...'}
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            onClick={handleCancelTransfer}
                            disabled={isCancelling || showCancelConfirmModal}
                            className="d-flex align-items-center px-3"
                            title="Cancel Transfer"
                          >
                            {isCancelling ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <FaTimes />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="primary" 
                          type="submit" 
                          size="lg"
                          disabled={isLoading || loadingVideoDetails}
                        >
                          {loadingVideoDetails ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Getting video details...
                            </>
                          ) : (
                            <>
                              <FaCloudUploadAlt className="me-2" />
                              Transfer to Google Drive
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </Form>
                </Card.Body>
              </Card>

              <div className="text-center">
                <p className="text-muted">
                  This application transfers your Loom videos directly to your Google Drive
                  without needing to download them first.
                </p>
                <div className="mt-3">
                  <Link href="/privacy" className="text-muted text-decoration-none">
                    <FaShieldAlt className="me-1" />
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        ) : null}

        {/* Folder selection modal */}
        {folderSelectionModal}

        {/* Video details confirmation modal */}
        <Modal show={showVideoDetailsModal} onHide={() => setShowVideoDetailsModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Transfer</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {videoDetails && (
              <div>
                <h5 className="mb-3">Video Details</h5>
                
                {/* Video thumbnail if available */}
                {videoDetails.thumbnailUrl && (
                  <div className="text-center mb-3">
                    <img 
                      src={videoDetails.thumbnailUrl} 
                      alt="Video thumbnail" 
                      className="img-fluid rounded"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
                
                <div className="mb-3">
                  <strong>Title:</strong>
                  <div className="text-muted">{videoDetails.title}</div>
                </div>
                
                <div className="mb-3">
                  <strong>Duration:</strong>
                  <div className="text-muted">{videoDetails.duration}</div>
                </div>
                
                {videoDetails.fileSize && (
                  <div className="mb-3">
                    <strong>File Size:</strong>
                    <div className="text-muted">{videoDetails.fileSize.formatted}</div>
                  </div>
                )}
                
                <div className="mb-3">
                  <strong>Destination:</strong>
                  <div className="text-muted">{folderName}</div>
                </div>
                
                <Alert variant="info" className="mt-3">
                  <FaInfoCircle className="me-2" />
                  This video will be transferred directly to your Google Drive without downloading to your device.
                </Alert>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowVideoDetailsModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmTransfer}>
              <FaCloudUploadAlt className="me-2" />
              Confirm Transfer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Cancel confirmation modal */}
        {cancelConfirmationModal}
      </Container>
    </>
  );
} 