-- Mot de passe local (optionnel), pour connexion e-mail + mot de passe
ALTER TABLE "User" ADD COLUMN "password_hash" TEXT;
