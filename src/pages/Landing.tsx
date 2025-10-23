import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import logo from "@/assets/edventure-park-logo.png";
import SupabaseConnectionTest from "@/components/SupabaseConnectionTest";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <img 
            src={logo} 
            alt="EdVenture Park" 
            className="h-32 mx-auto"
          />
          <h1 className="text-5xl font-bold text-foreground">
            Campus Lead Chartbusters
          </h1>
          <p className="text-xl text-muted-foreground">
            Track your campus leadership journey. Document your contributions. 
            Rise to the top of the leaderboard.
          </p>
          <div className="flex gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              onClick={() => navigate('/apply')}
              className="px-8"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/leaderboard')}
              className="px-8"
            >
              View Leaderboard
            </Button>
          </div>
          
          {/* Admin Access */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Administrator Access</p>
            <div className="flex gap-2 justify-center">
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => navigate('/admin-login')}
                className="px-6"
              >
                Admin Login
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => navigate('/superadmin-login')}
                className="px-6 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                Superadmin Login
              </Button>
            </div>
          </div>
          
          {/* Temporary connection test - remove after setup */}
          <div className="mt-16">
            <SupabaseConnectionTest />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;