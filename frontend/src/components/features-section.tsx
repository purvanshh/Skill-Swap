import { BookOpen, Calendar, Users, Video, Award, Shield } from 'lucide-react';

export function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Features designed for seamless skill exchanges
          </h2>
          <p className="text-muted-foreground text-lg">
            Our platform makes it easy to connect, learn, and grow without the barriers of traditional education.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Users className="h-10 w-10 text-primary" />}
            title="Smart Matching"
            description="Our algorithm connects you with the perfect learning partners based on complementary skills and availability."
          />
          
          <FeatureCard 
            icon={<Calendar className="h-10 w-10 text-primary" />}
            title="Flexible Scheduling"
            description="Book micro-sessions that fit your busy schedule, from quick 15-minute tips to hour-long deep dives."
          />
          
          <FeatureCard 
            icon={<Video className="h-10 w-10 text-primary" />}
            title="Integrated Video Calls"
            description="Seamless video integration so you can focus on learning, not technical setup."
          />
          
          <FeatureCard 
            icon={<BookOpen className="h-10 w-10 text-primary" />}
            title="Skill Tracking"
            description="Track your progress, set learning goals, and build a portfolio of acquired and shared skills."
          />
          
          <FeatureCard 
            icon={<Award className="h-10 w-10 text-primary" />}
            title="Community Recognition"
            description="Earn badges and ratings as you help others learn, building your reputation as a skilled teacher."
          />
          
          <FeatureCard 
            icon={<Shield className="h-10 w-10 text-primary" />}
            title="Secure Platform"
            description="Our platform prioritizes your privacy and security with encrypted communications."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-card p-6 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1">
      <div className="p-2 w-fit rounded-full bg-primary/10 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}