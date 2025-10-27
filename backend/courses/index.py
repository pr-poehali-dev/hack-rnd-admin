import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение списка курсов и управление прогрессом обучения
    Args: event - dict с httpMethod, queryStringParameters
          context - объект с атрибутами: request_id, function_name
    Returns: HTTP response dict со списком курсов
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    import psycopg2
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('user_id')
        
        if user_id:
            cur.execute("""
                SELECT c.id, c.title, c.description, c.duration, c.level, c.image_url,
                       u.full_name as instructor_name,
                       COALESCE(up.progress_percent, 0) as progress
                FROM courses c
                LEFT JOIN users u ON c.instructor_id = u.id
                LEFT JOIN user_progress up ON c.id = up.course_id AND up.user_id = %s
                ORDER BY c.created_at DESC
            """, (int(user_id),))
        else:
            cur.execute("""
                SELECT c.id, c.title, c.description, c.duration, c.level, c.image_url,
                       u.full_name as instructor_name
                FROM courses c
                LEFT JOIN users u ON c.instructor_id = u.id
                ORDER BY c.created_at DESC
            """)
        
        courses = cur.fetchall()
        conn.close()
        
        result = []
        for course in courses:
            course_data = {
                'id': course[0],
                'title': course[1],
                'description': course[2],
                'duration': course[3],
                'level': course[4],
                'image_url': course[5],
                'instructor_name': course[6]
            }
            if user_id and len(course) > 7:
                course_data['progress'] = course[7]
            result.append(course_data)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'courses': result})
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'enroll':
            user_id = body_data.get('user_id')
            course_id = body_data.get('course_id')
            
            cur.execute("""
                INSERT INTO user_progress (user_id, course_id, progress_percent)
                VALUES (%s, %s, 0)
                ON CONFLICT (user_id, course_id) DO NOTHING
                RETURNING id
            """, (user_id, course_id))
            
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True, 'message': 'Вы записаны на курс'})
            }
    
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }
