import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';


interface KoalaWelcomeEmailProps {
    name: string;
    email: string;
    lead_message: string;
    retreat?: string;
    accommodation?: string;
}
export const KoalaWelcomeEmail = ({
  name, email, lead_message, retreat, accommodation,
}: KoalaWelcomeEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>
        New message from {name}.
      </Preview>
      <Container style={container}>
        <Text style={paragraph}>Name: {name}</Text>
        <Text style={paragraph}>Email: {email}</Text>
        <Text style={paragraph}>
          Message: {lead_message}
        </Text>
        <Text style={paragraph}>
          Retreat: {retreat ? retreat : 'No retreat selected'}
        </Text>
        <Text style={paragraph}>
          Accommodation: {accommodation ? accommodation : 'No accommodation selected'}
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          www.carma-retreats.com
        </Text>
      </Container>
    </Body>
  </Html>
);

KoalaWelcomeEmail.PreviewProps = {
  name: 'Mising Name',
    email: 'Missing Email',
    lead_message: 'Mising Message',
} as KoalaWelcomeEmailProps;

export default KoalaWelcomeEmail;

const main = {
  backgroundColor: '#FFF8EE', // Cream background
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  color: '#352A1F', // Default text color: dark brown
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#352A1F', // Ensure text color stays consistent
};

const hr = {
  borderColor: '#9A4736', // Warm brown-red (like paper)
  margin: '20px 0',
};

const footer = {
  color: '#6D8B73', // Soft green accent
  fontSize: '12px',
};
