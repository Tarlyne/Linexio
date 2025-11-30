export const validateNewPassword = (password: string, confirmPassword?: string): string | null => {
  if (password.length < 4) {
    return "Das Passwort muss mindestens 4 Zeichen lang sein.";
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return "Die Passwörter stimmen nicht überein.";
  }
  return null;
};
