import json
import os
import hashlib
from typing import Dict, Any
from pydantic import BaseModel, Field, ValidationError, field_validator

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v.lower()

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v.lower()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Регистрация и авторизация пользователей образовательной платформы
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами: request_id, function_name
    Returns: HTTP response dict с данными пользователя
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        import psycopg2
        
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        if action == 'register':
            reg_req = RegisterRequest(**body_data)
            password_hash = hashlib.sha256(reg_req.password.encode()).hexdigest()
            
            cur.execute(
                "SELECT id FROM users WHERE email = %s",
                (reg_req.email,)
            )
            if cur.fetchone():
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Пользователь уже существует'})
                }
            
            cur.execute(
                "INSERT INTO users (email, password_hash, full_name, role) VALUES (%s, %s, %s, %s) RETURNING id, email, full_name, role, created_at",
                (reg_req.email, password_hash, reg_req.full_name, 'student')
            )
            user = cur.fetchone()
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({
                    'user': {
                        'id': user[0],
                        'email': user[1],
                        'full_name': user[2],
                        'role': user[3],
                        'created_at': str(user[4])
                    }
                })
            }
        
        elif action == 'login':
            login_req = LoginRequest(**body_data)
            password_hash = hashlib.sha256(login_req.password.encode()).hexdigest()
            
            cur.execute(
                "SELECT id, email, full_name, role, avatar_url FROM users WHERE email = %s AND password_hash = %s",
                (login_req.email, password_hash)
            )
            user = cur.fetchone()
            conn.close()
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Неверный email или пароль'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({
                    'user': {
                        'id': user[0],
                        'email': user[1],
                        'full_name': user[2],
                        'role': user[3],
                        'avatar_url': user[4]
                    }
                })
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }