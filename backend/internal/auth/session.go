package auth

import (
	"fmt"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	// In a real application, this should be loaded from environment variables
	jwtSecret = []byte("wwwmremote-secret-key-change-me")

	GlobalStore = NewSessionStore()
)

type UserSession struct {
	Username string
	UID      uint32
	GID      uint32
	HomeDir  string
}

type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]UserSession // map[token]UserSession
}

func NewSessionStore() *SessionStore {
	return &SessionStore{
		sessions: make(map[string]UserSession),
	}
}

func (s *SessionStore) CreateSession(username string, uid, gid uint32, homeDir string) (string, error) {
	claims := jwt.MapClaims{
		"username": username,
		"uid":      uid,
		"gid":      gid,
		"home_dir": homeDir,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // 24 hours expiry
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[tokenString] = UserSession{
		Username: username,
		UID:      uid,
		GID:      gid,
		HomeDir:  homeDir,
	}

	return tokenString, nil
}

func (s *SessionStore) ValidateSession(tokenString string) (UserSession, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return UserSession{}, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return UserSession{}, fmt.Errorf("invalid token claims")
	}

	username, ok := claims["username"].(string)
	if !ok {
		return UserSession{}, fmt.Errorf("username not found in token")
	}

	uidVal, ok := claims["uid"].(float64) // JWT numbers are float64 by default
	if !ok {
		return UserSession{}, fmt.Errorf("uid not found in token")
	}

	gidVal, ok := claims["gid"].(float64)
	if !ok {
		return UserSession{}, fmt.Errorf("gid not found in token")
	}

	homeDir, ok := claims["home_dir"].(string)
	if !ok {
		return UserSession{}, fmt.Errorf("homeDir not found in token")
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	session, exists := s.sessions[tokenString]
	if !exists || session.Username != username || session.UID != uint32(uidVal) || session.GID != uint32(gidVal) || session.HomeDir != homeDir {
		return UserSession{}, fmt.Errorf("session not found or invalid")
	}

	return session, nil
}

func (s *SessionStore) DeleteSession(tokenString string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, tokenString)
}
