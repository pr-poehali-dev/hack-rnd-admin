import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/b207e2f4-2db5-4525-a048-f4b39493ad37';
const COURSES_URL = 'https://functions.poehali.dev/c78ff66c-980f-4123-93e3-ee8fcb549148';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  level: string;
  image_url: string;
  instructor_name: string;
  progress?: number;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const { toast } = useToast();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    loadCourses();
  }, []);

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    try {
      const url = user ? `${COURSES_URL}?user_id=${user.id}` : COURSES_URL;
      const response = await fetch(url);
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleAuth = async (action: 'register' | 'login', email: string, password: string, fullName?: string) => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email, password, full_name: fullName }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast({
          title: action === 'login' ? 'Добро пожаловать!' : 'Регистрация успешна!',
          description: `Здравствуйте, ${data.user.full_name}`,
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка подключения',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({ title: 'Вы вышли из системы' });
  };

  const handleEnroll = async (courseId: number) => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Пожалуйста, войдите в систему',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(COURSES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enroll', user_id: user.id, course_id: courseId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: data.message,
        });
        loadCourses();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось записаться на курс',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">EduPlatform</h1>
            
            <div className="hidden md:flex items-center gap-8">
              {[
                { name: 'Главная', id: 'hero' },
                { name: 'Курсы', id: 'courses' },
                { name: 'О нас', id: 'about' },
                { name: 'FAQ', id: 'faq' },
                { name: 'Контакты', id: 'contacts' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Привет, {user.full_name}</span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Выйти
                  </Button>
                </div>
              ) : (
                <AuthDialog onAuth={handleAuth} />
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <section id="hero" className="py-24 px-6">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <h2 className="text-6xl font-bold tracking-tight leading-tight">
              Образование
              <br />
              нового уровня
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Современная платформа для онлайн-обучения с персональными курсами и квалифицированными преподавателями
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button size="lg" className="rounded-full px-8" onClick={() => scrollToSection('courses')}>
                Начать обучение
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8">
                Узнать больше
              </Button>
            </div>
          </div>
        </section>

        <section id="courses" className="py-20 px-6 bg-secondary/30">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-4xl font-bold text-center mb-16">Доступные курсы</h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} onEnroll={handleEnroll} userLoggedIn={!!user} />
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h3 className="text-4xl font-bold">О платформе</h3>
            <p className="text-lg text-muted-foreground font-serif">
              EduPlatform — это современное образовательное пространство, где студенты находят качественные курсы, 
              а преподаватели делятся своими знаниями. Мы верим, что образование должно быть доступным и увлекательным.
            </p>
            <div className="grid md:grid-cols-3 gap-8 pt-8">
              <FeatureCard
                icon="BookOpen"
                title="500+ курсов"
                description="Широкий выбор образовательных программ"
              />
              <FeatureCard
                icon="Users"
                title="Опытные преподаватели"
                description="Профессионалы своего дела"
              />
              <FeatureCard
                icon="Award"
                title="Сертификаты"
                description="Официальное подтверждение знаний"
              />
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 px-6 bg-secondary/30">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-4xl font-bold text-center mb-12">Часто задаваемые вопросы</h3>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-background px-6 rounded-lg border">
                <AccordionTrigger className="text-left">
                  Как начать обучение на платформе?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Зарегистрируйтесь на платформе, выберите интересующий курс и начните обучение. Все материалы станут доступны сразу после записи.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="bg-background px-6 rounded-lg border">
                <AccordionTrigger className="text-left">
                  Можно ли получить сертификат?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Да, после успешного завершения курса вы получите официальный сертификат о прохождении обучения.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="bg-background px-6 rounded-lg border">
                <AccordionTrigger className="text-left">
                  Есть ли поддержка студентов?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Наша команда поддержки всегда готова помочь. Вы также можете задавать вопросы преподавателям в рамках курса.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <section id="contacts" className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h3 className="text-4xl font-bold">Свяжитесь с нами</h3>
            <p className="text-lg text-muted-foreground font-serif">
              Есть вопросы? Мы всегда рады помочь
            </p>
            <div className="grid md:grid-cols-3 gap-8 pt-8">
              <ContactCard icon="Mail" title="Email" value="info@eduplatform.ru" />
              <ContactCard icon="Phone" title="Телефон" value="+7 (999) 123-45-67" />
              <ContactCard icon="MapPin" title="Адрес" value="Москва, ул. Образования, 1" />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-primary-foreground py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm opacity-80">© 2024 EduPlatform. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}

function AuthDialog({ onAuth }: { onAuth: (action: 'register' | 'login', email: string, password: string, fullName?: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Войти</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Авторизация</DialogTitle>
          <DialogDescription>Войдите или создайте новый аккаунт</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Пароль</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => onAuth('login', email, password)}>
              Войти
            </Button>
          </TabsContent>
          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="register-name">Полное имя</Label>
              <Input
                id="register-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иван Иванов"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Пароль</Label>
              <Input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => onAuth('register', email, password, fullName)}>
              Зарегистрироваться
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CourseCard({ course, onEnroll, userLoggedIn }: { course: Course; onEnroll: (id: number) => void; userLoggedIn: boolean }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
        <Icon name="GraduationCap" size={64} className="text-accent opacity-50" />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{course.title}</CardTitle>
          {course.progress !== undefined && (
            <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">{course.progress}%</span>
          )}
        </div>
        <CardDescription className="font-serif">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icon name="Clock" size={16} />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="BarChart" size={16} />
            <span>{course.level}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Icon name="User" size={16} className="text-muted-foreground" />
          <span className="text-muted-foreground">{course.instructor_name}</span>
        </div>
        <Button 
          className="w-full" 
          onClick={() => onEnroll(course.id)}
          disabled={!userLoggedIn || (course.progress !== undefined && course.progress >= 0)}
        >
          {!userLoggedIn ? 'Требуется вход' : course.progress !== undefined ? 'Продолжить' : 'Записаться'}
        </Button>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
        <Icon name={icon} size={32} className="text-accent" />
      </div>
      <h4 className="text-xl font-semibold">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function ContactCard({ icon, title, value }: { icon: string; title: string; value: string }) {
  return (
    <div className="text-center space-y-2">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10">
        <Icon name={icon} size={24} className="text-accent" />
      </div>
      <h4 className="font-semibold">{title}</h4>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

