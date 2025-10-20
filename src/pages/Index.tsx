import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-5xl font-bold">
          <span className="text-gradient">FounderFlow</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Project Management & Finance Dashboard for Founders
        </p>
        <p className="text-muted-foreground">
          Track projects, manage tasks, monitor finances, and get real-time insights
        </p>
        <Button
          onClick={() => navigate('/auth')}
          className="btn-primary text-lg px-8 py-6"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
