INSERT INTO users (email, password_hash, full_name, role) 
VALUES 
  ('anna.smirnova@edu.ru', 'instructor_hash_1', 'Анна Смирнова', 'instructor'),
  ('dmitry.petrov@edu.ru', 'instructor_hash_2', 'Дмитрий Петров', 'instructor'),
  ('elena.volkova@edu.ru', 'instructor_hash_3', 'Елена Волкова', 'instructor')
ON CONFLICT (email) DO NOTHING;

INSERT INTO courses (title, description, instructor_id, duration, level, image_url) 
VALUES 
  (
    'Основы веб-разработки',
    'Изучите HTML, CSS и JavaScript с нуля',
    (SELECT id FROM users WHERE email = 'anna.smirnova@edu.ru'),
    '8 недель',
    'Начальный',
    ''
  ),
  (
    'Python для анализа данных',
    'Data Science и машинное обучение на практике',
    (SELECT id FROM users WHERE email = 'dmitry.petrov@edu.ru'),
    '10 недель',
    'Средний',
    ''
  ),
  (
    'UX/UI Дизайн',
    'Создавайте удобные и красивые интерфейсы',
    (SELECT id FROM users WHERE email = 'elena.volkova@edu.ru'),
    '6 недель',
    'Начальный',
    ''
  );