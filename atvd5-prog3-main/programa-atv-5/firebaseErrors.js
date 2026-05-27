export function mensagemErroFirebase(error) {
  const code = error?.code || '';

  const mapa = {
    'auth/invalid-api-key': 'Chave da API inválida. Confira o firebaseConfig.js',
    'auth/invalid-email': 'E-mail inválido',
    'auth/user-disabled': 'Usuário desativado no Firebase',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/invalid-credential': 'E-mail ou senha incorretos',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado',
    'auth/weak-password': 'Senha fraca (mínimo 6 caracteres)',
    'auth/operation-not-allowed':
      'Login por e-mail/senha não está ativado no Firebase (Authentication > Sign-in method)',
    'auth/too-many-requests': 'Muitas tentativas. Tente de novo mais tarde',
    'auth/network-request-failed': 'Sem internet ou Firebase bloqueado',
    'auth/requires-recent-login':
      'Por segurança, faça login de novo antes de alterar a senha',
    'auth/unauthorized-domain':
      'Domínio não autorizado. No Firebase, adicione "localhost" em Authentication > Settings > Authorized domains',
  };

  if (mapa[code]) return mapa[code];
  return error?.message || 'Erro no Firebase';
}
