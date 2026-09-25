import dns from 'node:dns';
import net from 'node:net';

// Known fake / disposable email providers
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'mailinator.com', '10minutemail.com',
  'yopmail.com', 'trashmail.com', 'guerrillamail.com', 'dispostable.com',
  'fake.com', 'test.com', 'example.com', 'invalid.com', 'throwaway.com',
  'maildrop.cc', 'getnada.com', 'byom.de', 'sharklasers.com', '0clickmail.com',
  'mailcatch.com', 'disposablemail.com'
]);

// Popular domain typo mapping for automatic detection & correction guidance
const TYPO_DOMAINS: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmai.co': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaho.co': 'yahoo.com',
  'yaho.in': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmali.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlok.co': 'outlook.com',
  'icoud.com': 'icloud.com',
  'icloud.co': 'icloud.com',
};

export interface EmailVerificationResult {
  valid: boolean;
  reason?: string;
  suggestedCorrection?: string;
}

/**
 * Executes a live SMTP RCPT TO handshake probe to test if a specific mailbox account exists on the target mail server.
 */
function probeMailboxExistence(email: string, mxHost: string): Promise<{ exists: boolean; reason?: string }> {
  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxHost);
    let step = 0;
    let responseAcc = '';

    socket.setTimeout(3500);

    socket.on('timeout', () => {
      socket.destroy();
      // On timeout (e.g. cloud ISP port 25 block), fallback safely
      resolve({ exists: true });
    });

    socket.on('error', () => {
      socket.destroy();
      // On connection error, fallback gracefully
      resolve({ exists: true });
    });

    socket.on('data', (data) => {
      responseAcc += data.toString();
      const lines = responseAcc.split('\r\n');

      for (const line of lines) {
        if (!line) continue;
        const code = parseInt(line.substring(0, 3), 10);
        if (isNaN(code)) continue;

        if (step === 0 && code === 220) {
          step = 1;
          socket.write('EHLO jbsnap.app\r\n');
        } else if (step === 1 && code === 250) {
          step = 2;
          socket.write('MAIL FROM:<verify@jbsnap.app>\r\n');
        } else if (step === 2 && code === 250) {
          step = 3;
          socket.write(`RCPT TO:<${email}>\r\n`);
        } else if (step === 3) {
          socket.write('QUIT\r\n');
          socket.end();

          if (code === 250 || code === 251) {
            resolve({ exists: true });
          } else if (code >= 500 && code <= 554) {
            resolve({
              exists: false,
              reason: `The email address '${email}' does not exist on mail servers (${line.trim()}).`
            });
          } else {
            resolve({ exists: true });
          }
          return;
        }
      }
    });
  });
}

/**
 * Deep 6-Tier Email Verification Engine:
 * 1. Syntax & RFC 5322 regex check + minimum username length
 * 2. Popular domain typo detection (e.g. gmai.com -> Did you mean gmail.com?)
 * 3. Disposable / fake domain filter
 * 4. Provider-specific account rules (Gmail 6-30 chars constraint)
 * 5. Strict MX (Mail Exchange) DNS Lookup (No A-record fallback)
 * 6. Live SMTP RCPT TO Mailbox Existence Handshake Probe (Verifies specific inbox account existence!)
 */
export async function verifyEmailExistence(email: string): Promise<EmailVerificationResult> {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email address is required.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Tier 1: Syntax & Format Check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { valid: false, reason: 'Invalid email format. Please enter a valid email address (e.g. user@example.com).' };
  }

  const [username, domain] = cleanEmail.split('@');

  if (!username || !domain) {
    return { valid: false, reason: 'Malformed email address.' };
  }

  // Username minimum length check
  if (username.length < 2) {
    return { valid: false, reason: 'Email username prefix is too short. Please enter a valid email address.' };
  }

  // Tier 2: Typo Detection (e.g. gmai.com)
  if (TYPO_DOMAINS[domain]) {
    const suggestedDomain = TYPO_DOMAINS[domain];
    return {
      valid: false,
      reason: `The email domain '${domain}' appears to be misspelled. Did you mean '${suggestedDomain}'?`,
      suggestedCorrection: `${username}@${suggestedDomain}`,
    };
  }

  // Tier 3: Disposable / Fake Domain Check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: `The domain '${domain}' is a temporary/disposable email provider and is not allowed.` };
  }

  // Tier 4: Provider-Specific Account Constraints
  if (domain === 'gmail.com') {
    // Gmail accounts require usernames between 6 and 30 characters consisting of letters, numbers, and periods
    const cleanUsername = username.replace(/\./g, '');
    if (cleanUsername.length < 6 || cleanUsername.length > 30) {
      return {
        valid: false,
        reason: `Gmail usernames must be between 6 and 30 characters. '${username}' is not a valid Gmail address.`
      };
    }
  } else if (domain === 'yahoo.com' || domain === 'outlook.com' || domain === 'hotmail.com') {
    if (username.length < 4) {
      return {
        valid: false,
        reason: `Email username '${username}' is too short for ${domain}. Please provide a valid email address.`
      };
    }
  }

  // Tier 5: Strict MX (Mail Exchange) DNS Lookup (No A-Record Fallback!)
  let primaryMxHost = '';
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        reason: `The domain '${domain}' does not have mail servers (MX DNS records) and cannot receive emails.`
      };
    }

    // Sort by priority (lowest preference number is primary server)
    mxRecords.sort((a, b) => a.priority - b.priority);
    primaryMxHost = mxRecords[0].exchange;

    if (!primaryMxHost) {
      return {
        valid: false,
        reason: `The domain '${domain}' has invalid mail server records and cannot accept emails.`
      };
    }
  } catch (err: any) {
    return {
      valid: false,
      reason: `The domain '${domain}' does not exist or has no active mail servers. Please double-check your email spelling.`
    };
  }

  // Tier 6: Live SMTP RCPT TO Mailbox Existence Handshake Probe
  if (primaryMxHost) {
    try {
      const probeResult = await probeMailboxExistence(cleanEmail, primaryMxHost);
      if (!probeResult.exists) {
        return {
          valid: false,
          reason: probeResult.reason || `The email account '${cleanEmail}' does not exist on ${domain} mail servers.`
        };
      }
    } catch {
      // Ignore probe exceptions and allow fallback
    }
  }

  return { valid: true };
}
