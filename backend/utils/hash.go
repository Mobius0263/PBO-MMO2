package utils

import (
    "golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
    return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}

func ComparePasswords(hashedPassword, plainPassword string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
    return err == nil
}