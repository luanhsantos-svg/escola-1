/** Autenticação e autorização. */

const SESSION_TTL_SECONDS = 21600;
const SESSION_PREFIX = 'portal_session_';

function login_(payload) {
  const username = String(payload.username || '').trim().toLowerCase();
  const password = String(payload.password || '');
  if (!username || !password) throw new Error('Informe usuário e senha.');

  const user = findRecord_('USUARIOS', item => (
    String(item.USUARIO || '').trim().toLowerCase() === username &&
    String(item.ATIVO).toUpperCase() !== 'FALSE'
  ));

  if (!user || !verifyPassword_(password, user.SALT, user.SENHA_HASH)) {
    throw new Error('Usuário ou senha inválidos.');
  }

  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const session = {
    token,
    userId: user.ID,
    name: user.NOME,
    username: user.USUARIO,
    role: user.PERFIL,
    createdAt: nowIso_()
  };

  CacheService.getScriptCache().put(
    SESSION_PREFIX + token,
    JSON.stringify(session),
    SESSION_TTL_SECONDS
  );

  updateRecordRow_('USUARIOS', user.__ROW, { ULTIMO_ACESSO: nowIso_() });
  audit_(session, 'LOGIN', 'USUARIO', user.ID, { username: user.USUARIO });

  return {
    token,
    expiresIn: SESSION_TTL_SECONDS,
    user: sanitizeUser_(user)
  };
}

function logout_(token) {
  if (token) CacheService.getScriptCache().remove(SESSION_PREFIX + token);
  return { success: true };
}

function getSession_(token) {
  if (!token) return null;
  const cached = CacheService.getScriptCache().get(SESSION_PREFIX + token);
  if (!cached) return null;

  try {
    const session = JSON.parse(cached);
    CacheService.getScriptCache().put(
      SESSION_PREFIX + token,
      JSON.stringify(session),
      SESSION_TTL_SECONDS
    );
    return session;
  } catch (error) {
    return null;
  }
}

function requireSession_(token) {
  const session = getSession_(token);
  if (!session) throw new Error('Sessão inválida ou expirada. Entre novamente.');
  return session;
}

function requireRole_(session, allowedRoles) {
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Você não possui permissão para realizar esta ação.');
  }
}

function sanitizeUser_(user) {
  return {
    id: user.ID,
    name: user.NOME,
    username: user.USUARIO,
    role: user.PERFIL,
    active: String(user.ATIVO).toUpperCase() !== 'FALSE'
  };
}

function createPasswordRecord_(password) {
  const salt = Utilities.getUuid().replace(/-/g, '');
  return {
    salt,
    hash: hashPassword_(password, salt)
  };
}

function verifyPassword_(password, salt, expectedHash) {
  return hashPassword_(password, salt) === String(expectedHash || '');
}

function hashPassword_(password, salt) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    `${salt}:${password}`,
    Utilities.Charset.UTF_8
  );
  return bytes.map(byte => {
    const normalized = byte < 0 ? byte + 256 : byte;
    return normalized.toString(16).padStart(2, '0');
  }).join('');
}
