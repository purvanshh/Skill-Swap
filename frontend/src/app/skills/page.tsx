"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Star, X } from "lucide-react";

// Sample skills data
const skillsData = [
  {
    id: 1,
    name: "Photoshop",
    category: "Design",
    availableTeachers: 24,
    popularityRank: 1
  },
  {
    id: 2,
    name: "Excel",
    category: "Business",
    availableTeachers: 45,
    popularityRank: 2
  },
  {
    id: 3,
    name: "Python",
    category: "Programming",
    availableTeachers: 38,
    popularityRank: 3
  },
  {
    id: 4,
    name: "Public Speaking",
    category: "Communication",
    availableTeachers: 19,
    popularityRank: 4
  },
  {
    id: 5,
    name: "Guitar",
    category: "Music",
    availableTeachers: 27,
    popularityRank: 5
  },
  {
    id: 6,
    name: "French",
    category: "Languages",
    availableTeachers: 22,
    popularityRank: 6
  },
  {
    id: 7,
    name: "Yoga",
    category: "Fitness",
    availableTeachers: 31,
    popularityRank: 7
  },
  {
    id: 8,
    name: "Photography",
    category: "Arts",
    availableTeachers: 29,
    popularityRank: 8
  }
];

// Sample teachers data
const teachersData = [
  {
    id: 1,
    name: "Jennifer Lee",
    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    initials: "JL",
    skills: ["Photoshop", "Illustrator"],
    rating: 4.9,
    completedSessions: 42,
  },
  {
    id: 2,
    name: "Michael Brown",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    initials: "MB",
    skills: ["Excel", "PowerPoint"],
    rating: 4.7,
    completedSessions: 38,
  },
  {
    id: 3,
    name: "Sarah Johnson",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    initials: "SJ",
    skills: ["Python", "Data Analysis"],
    rating: 4.8,
    completedSessions: 27,
  },
  {
    id: 4,
    name: "David Wilson",
    avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    initials: "DW",
    skills: ["Guitar", "Music Theory"],
    rating: 5.0,
    completedSessions: 51,
  }
];

// Categories
const categories = ["All", "Design", "Programming", "Business", "Music", "Languages", "Communication", "Fitness", "Arts"];

export default function SkillsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  // Filter skills based on category and search query
  const filteredSkills = skillsData.filter(skill => {
    const matchesCategory = selectedCategory === "All" || skill.category === selectedCategory;
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Filter teachers based on selected skill
  const filteredTeachers = selectedSkill 
    ? teachersData.filter(teacher => teacher.skills.includes(selectedSkill.name))
    : [];
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Browse Skills</h1>
        <p className="text-muted-foreground mt-2">
          Discover skills to learn or find people to teach
        </p>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search skills..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Button variant="outline" className="md:w-auto w-full gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>
      
      {/* Categories */}
      <div className="flex overflow-x-auto pb-4 mb-8 space-x-2 -mx-2 px-2">
        {categories.map(category => (
          <Button 
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="whitespace-nowrap"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Skills List */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Popular Skills</h2>
          <div className="space-y-2">
            {filteredSkills.map((skill) => (
              <div 
                key={skill.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedSkill?.id === skill.id 
                    ? "bg-primary/10 border-primary" 
                    : "bg-card hover:bg-muted/50"
                }`}
                onClick={() => setSelectedSkill(skill)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{skill.name}</h3>
                    <p className="text-sm text-muted-foreground">{skill.category}</p>
                  </div>
                  <Badge variant="outline">{skill.availableTeachers} teachers</Badge>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-muted-foreground">Popularity rank:</span>
                  <span className="ml-1 font-medium">#{skill.popularityRank}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Teachers List */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedSkill 
                ? `Teachers for ${selectedSkill.name}` 
                : "Available Teachers"}
            </h2>
            {selectedSkill && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedSkill(null)}
                className="gap-1 h-8 text-xs"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
          
          {filteredTeachers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTeachers.map((teacher) => (
                <Card key={teacher.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-primary/10">
                        <AvatarImage src={teacher.avatar} alt={teacher.name} />
                        <AvatarFallback>{teacher.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{teacher.name}</h3>
                        <div className="flex items-center mt-1">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span className="ml-1 text-sm">{teacher.rating}</span>
                          <span className="mx-1 text-muted-foreground text-sm">•</span>
                          <span className="text-sm text-muted-foreground">
                            {teacher.completedSessions} sessions
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {teacher.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-6">
                      <Button className="flex-1">Request Session</Button>
                      <Button variant="outline">View Profile</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {selectedSkill 
                    ? `No teachers found for ${selectedSkill.name}` 
                    : "Select a skill to see available teachers"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {selectedSkill 
                    ? "Try selecting a different skill or adjusting your filters" 
                    : "Choose from the list of skills to view available teachers"}
                </p>
                {selectedSkill && (
                  <Button onClick={() => setSelectedSkill(null)}>
                    Browse All Skills
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}