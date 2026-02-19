import * as React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components'

interface TeamInvitationEmailProps {
  teamName: string
  teamGame: string
  role: string
  inviterName: string
  invitationUrl: string
  expiresAt: Date
}

export const TeamInvitationEmail: React.FC<TeamInvitationEmailProps> = ({
  teamName,
  teamGame,
  role,
  inviterName,
  invitationUrl,
  expiresAt,
}) => {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.title}>🎮 Team Invitation</Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>Hi there!</Text>

            <Text style={styles.text}>
              <strong>{inviterName}</strong> has invited you to join{' '}
              <strong>{teamName}</strong> as a <strong>{role}</strong>.
            </Text>

            <Section style={styles.teamInfo}>
              <Text style={styles.infoLabel}>Team Details:</Text>
              <Text style={styles.infoText}>
                <strong>Team:</strong> {teamName}
                <br />
                <strong>Game:</strong> {teamGame}
                <br />
                <strong>Role:</strong> {role}
              </Text>
            </Section>

            <Section style={styles.buttonContainer}>
              <Button href={invitationUrl} style={styles.button}>
                View Invitation
              </Button>
            </Section>

            <Text style={styles.expiry}>
              This invitation expires on {expiryDate}
            </Text>

            <Hr style={styles.divider} />

            <Text style={styles.footer}>
              If you didn&apos;t expect this invitation, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
    textAlign: 'center' as const,
  },
  title: {
    color: '#ffffff',
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
  },
  content: {
    padding: '40px 30px',
  },
  greeting: {
    fontSize: '18px',
    marginBottom: '20px',
    color: '#333333',
  },
  text: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#555555',
    marginBottom: '20px',
  },
  teamInfo: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
  },
  infoLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: '10px',
  },
  infoText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#333333',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  button: {
    display: 'inline-block',
    padding: '14px 40px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  expiry: {
    fontSize: '14px',
    color: '#999999',
    textAlign: 'center' as const,
    marginTop: '20px',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #eeeeee',
    margin: '30px 0',
  },
  footer: {
    fontSize: '14px',
    color: '#999999',
    textAlign: 'center' as const,
  },
}

// Plain text version for email clients that don't support HTML
export const teamInvitationEmailText = ({
  teamName,
  teamGame,
  role,
  inviterName,
  invitationUrl,
  expiresAt,
}: TeamInvitationEmailProps) => {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return `
Team Invitation

Hi there!

${inviterName} has invited you to join ${teamName} as a ${role}.

Team Details:
- Team: ${teamName}
- Game: ${teamGame}
- Role: ${role}

View your invitation: ${invitationUrl}

This invitation expires on ${expiryDate}

If you didn't expect this invitation, you can safely ignore this email.
  `.trim()
}
