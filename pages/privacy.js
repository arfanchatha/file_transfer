import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Link from 'next/link';
import Head from 'next/head';
import { FaShieldAlt, FaArrowLeft } from 'react-icons/fa';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Loom to Google Drive Transfer</title>
        <meta name="description" content="Privacy Policy for Loom to Google Drive Transfer app. Learn how we protect your data and privacy." />
        <link rel="icon" href="/assets/filelift.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Container className="py-5">
        <Row className="mb-4">
          <Col>
            <div className="d-flex align-items-center mb-3">
              <Link href="/" className="text-decoration-none me-3">
                <FaArrowLeft className="me-2" />
                Back to Home
              </Link>
            </div>
            <h1 className="text-center mb-4">
              <FaShieldAlt className="me-2" />
              Privacy Policy
            </h1>
            <p className="text-center text-muted">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </Col>
        </Row>

        <Row>
          <Col lg={8} className="mx-auto">
            <Card className="shadow-sm">
              <Card.Body className="p-5">
                <div className="privacy-content">
                  <section className="mb-5">
                    <h2>Introduction</h2>
                    <p>
                      This Privacy Policy describes how Loom to Google Drive Transfer ("we", "our", or "us") 
                      collects, uses, and protects your information when you use our web application. 
                      We are committed to protecting your privacy and ensuring the security of your personal information.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2>Information We Collect</h2>
                    
                    <h4>Information You Provide</h4>
                    <ul>
                      <li><strong>Loom Video URLs:</strong> The Loom video links you provide for transfer</li>
                      <li><strong>File Names:</strong> Optional custom file names you specify</li>
                      <li><strong>Folder Selection:</strong> Your chosen Google Drive folder destinations</li>
                    </ul>

                    <h4>Information We Receive from Third Parties</h4>
                    <ul>
                      <li><strong>Google Account Information:</strong> When you authenticate with Google, we receive:
                        <ul>
                          <li>Your name and email address</li>
                          <li>Profile picture</li>
                          <li>Google account ID</li>
                        </ul>
                      </li>
                      <li><strong>Google Drive Access:</strong> Limited access to create and manage files in your Google Drive</li>
                      <li><strong>Loom Video Metadata:</strong> Video titles, durations, and thumbnail URLs from Loom's public API</li>
                    </ul>

                    <h4>Technical Information</h4>
                    <ul>
                      <li>Browser type and version</li>
                      <li>IP address (for security and debugging purposes)</li>
                      <li>Usage logs and error reports</li>
                    </ul>
                  </section>

                  <section className="mb-5">
                    <h2>How We Use Your Information</h2>
                    <p>We use the collected information solely for the following purposes:</p>
                    <ul>
                      <li><strong>Video Transfer Service:</strong> To facilitate the transfer of Loom videos to your Google Drive</li>
                      <li><strong>Authentication:</strong> To verify your identity and provide secure access to Google Drive</li>
                      <li><strong>Service Improvement:</strong> To monitor and improve the performance and reliability of our service</li>
                      <li><strong>Error Handling:</strong> To diagnose and fix technical issues</li>
                    </ul>
                  </section>

                  <section className="mb-5">
                    <h2>Data Storage and Security</h2>
                    
                    <h4>No Long-term Data Storage</h4>
                    <ul>
                      <li>We do not store your videos on our servers</li>
                      <li>Videos are streamed directly from Loom to your Google Drive</li>
                      <li>Authentication tokens are stored temporarily in your browser's local storage</li>
                      <li>We do not maintain a database of user information or transfer history</li>
                    </ul>

                    <h4>Security Measures</h4>
                    <ul>
                      <li>All communications are encrypted using HTTPS/TLS</li>
                      <li>We use Google's official OAuth 2.0 authentication system</li>
                      <li>Access tokens are handled securely and never logged</li>
                      <li>We follow industry best practices for web application security</li>
                    </ul>
                  </section>

                  <section className="mb-5">
                    <h2>Third-Party Services</h2>
                    
                    <h4>Google Services</h4>
                    <p>
                      Our application integrates with Google Drive and Google OAuth. Your use of Google services 
                      is subject to Google's Privacy Policy and Terms of Service. We only request the minimum 
                      necessary permissions to provide our service.
                    </p>

                    <h4>Loom Integration</h4>
                    <p>
                      We access Loom's public oEmbed API to retrieve video metadata (title, duration, thumbnail). 
                      We do not store or share this information beyond what's necessary for the transfer process.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2>Your Rights and Choices</h2>
                    <ul>
                      <li><strong>Access Control:</strong> You can revoke our access to your Google Drive at any time through your Google Account settings</li>
                      <li><strong>Data Deletion:</strong> You can clear your browser's local storage to remove any locally stored authentication tokens</li>
                      <li><strong>Service Discontinuation:</strong> You can stop using our service at any time</li>
                    </ul>
                  </section>

                  <section className="mb-5">
                    <h2>Data Sharing and Disclosure</h2>
                    <p>We do not sell, trade, or share your personal information with third parties, except:</p>
                    <ul>
                      <li>As necessary to provide the service (transferring videos to your Google Drive)</li>
                      <li>When required by law or to protect our legal rights</li>
                      <li>To prevent fraud or security threats</li>
                    </ul>
                  </section>

                  <section className="mb-5">
                    <h2>Cookies and Local Storage</h2>
                    <p>
                      Our application uses browser local storage to temporarily store authentication tokens. 
                      This allows you to remain logged in during your session. We do not use tracking cookies 
                      or third-party analytics services.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2>Children's Privacy</h2>
                    <p>
                      Our service is not intended for children under 13 years of age. We do not knowingly 
                      collect personal information from children under 13. If you are a parent or guardian 
                      and believe your child has provided us with personal information, please contact us.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2>International Data Transfers</h2>
                    <p>
                      Our service operates through web browsers and utilizes Google's global infrastructure. 
                      Data may be processed in various countries where Google operates. All transfers are 
                      protected by appropriate safeguards.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2>Changes to This Privacy Policy</h2>
                    <p>
                      We may update this Privacy Policy from time to time. We will notify users of any 
                      material changes by updating the "Last updated" date at the top of this policy. 
                      Continued use of the service after changes indicates acceptance of the updated policy.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2>Open Source and Transparency</h2>
                    <p>
                      This application is built with transparency in mind. The source code demonstrates 
                      our commitment to privacy by design, showing exactly how your data is handled 
                      without unnecessary collection or storage.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2>Contact Information</h2>
                    <p>
                      If you have any questions about this Privacy Policy or our data practices, 
                      please contact us at:
                    </p>
                    <div className="bg-light p-3 rounded">
                      <p className="mb-1"><strong>Email:</strong> privacy@your-domain.com</p>
                      <p className="mb-0"><strong>Subject:</strong> Privacy Policy Inquiry - Loom to Google Drive Transfer</p>
                    </div>
                  </section>

                  <section>
                    <h2>Summary</h2>
                    <div className="bg-primary bg-opacity-10 p-4 rounded">
                      <h5>Key Points:</h5>
                      <ul className="mb-0">
                        <li>We don't store your videos - they go directly from Loom to your Google Drive</li>
                        <li>We only access the minimum necessary Google Drive permissions</li>
                        <li>Authentication tokens are stored locally in your browser</li>
                        <li>We don't share your data with third parties</li>
                        <li>You can revoke access at any time through your Google Account</li>
                      </ul>
                    </div>
                  </section>
                </div>
              </Card.Body>
            </Card>

            <div className="text-center mt-4">
              <Link href="/" className="btn btn-primary">
                <FaArrowLeft className="me-2" />
                Return to Application
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
} 