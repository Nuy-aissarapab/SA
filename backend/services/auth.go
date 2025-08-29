package services

import (
	"errors"
	"time"
	"github.com/golang-jwt/jwt/v5"
)

type JwtWrapper struct {
	SecretKey       string
	Issuer          string
	ExpirationHours int64
}

type JwtClaim struct {
	Email  string
	UserID uint
	Role   string
	jwt.RegisteredClaims
}

func (j *JwtWrapper) GenerateToken(email string, userID uint, role string) (string, error) {
	claims := &JwtClaim{
		Email:  email,
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * time.Duration(j.ExpirationHours))),
			Issuer:    j.Issuer,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.SecretKey))
}

func (j *JwtWrapper) ValidateToken(signedToken string) (*JwtClaim, error) {
	token, err := jwt.ParseWithClaims(signedToken, &JwtClaim{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(j.SecretKey), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*JwtClaim)
	if !ok || !token.Valid {
		return nil, errors.New("couldn't parse claims or token invalid")
	}
	return claims, nil
}
