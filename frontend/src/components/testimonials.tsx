import { Card, CardContent } from "@/components/ui/card";

export function Testimonials() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            What Our Community Says
          </h2>
          <p className="text-muted-foreground text-lg">
            Thousands of students are already exchanging skills and growing together.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TestimonialCard
            quote="I learned Photoshop basics in just three 30-minute sessions, and in return, I taught Excel formulas. It was so much more engaging than watching tutorials!"
            author="Alice Chen"
            role="Graphic Design Student"
            avatar="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          />
          
          <TestimonialCard
            quote="As someone who works full-time, I never found time for traditional courses. SkillSwap lets me learn web development in small, manageable sessions that fit my schedule."
            author="Michael Rodriguez"
            role="Marketing Professional"
            avatar="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          />
          
          <TestimonialCard
            quote="I've taught piano for years, but never found an easy way to learn photography in return. SkillSwap connected me with the perfect learning partner within days."
            author="Emma Johnson"
            role="Music Teacher"
            avatar="https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          />
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ quote, author, role, avatar }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-4">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.5 25H7.5L15 10H10L2.5 25V35H17.5V25Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M37.5 25H27.5L35 10H30L22.5 25V35H37.5V25Z" fill="currentColor" fillOpacity="0.2" />
          </svg>
        </div>
        <p className="mb-6 text-lg">{quote}</p>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full overflow-hidden">
            <img src={avatar} alt={author} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="font-medium">{author}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}