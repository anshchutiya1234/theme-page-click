import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import { motion } from 'framer-motion';
import { 
  Video, 
  Palette, 
  BarChart3, 
  Users, 
  Clock, 
  DollarSign,
  CheckCircle,
  LogIn,
  Briefcase,
  Target,
  MessageSquare,
  Calendar
} from 'lucide-react';

const Index = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-partner-primary/5 to-partner-secondary/5"></div>
          <motion.div 
            className="max-w-7xl mx-auto text-center relative z-10"
            initial="initial"
            animate="animate"
            variants={staggerChildren}
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-partner-primary/10 text-partner-primary text-sm font-medium">
                <Briefcase className="w-4 h-4 mr-2" />
                Partner Management System
              </span>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Welcome to Your{' '}
              <span className="text-partner-primary">Partner Dashboard</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              Manage your projects, track earnings, and collaborate with our team. 
              Your central hub for all partner activities and project management.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button asChild size="lg" className="bg-partner-primary hover:bg-partner-secondary text-white px-8 py-4 text-lg">
                <Link to="/login">
                  <LogIn className="w-5 h-5 mr-2" />
                  Access Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-partner-primary text-partner-primary hover:bg-partner-primary hover:text-white px-8 py-4 text-lg">
                <Link to="/join">
                  <Users className="w-5 h-5 mr-2" />
                  New Partner Setup
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Dashboard Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Your Partner Dashboard</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to manage your work, track progress, and collaborate with our team.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
            >
              <motion.div variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-partner-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Briefcase className="w-8 h-8 text-partner-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Project Management</h3>
                    <p className="text-gray-600">
                      View your assigned projects, track deadlines, submit completed work, and manage your project pipeline.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-partner-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BarChart3 className="w-8 h-8 text-partner-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Performance Tracking</h3>
                    <p className="text-gray-600">
                      Monitor your work performance, completion rates, and track your earnings growth over time.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-partner-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <DollarSign className="w-8 h-8 text-partner-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Earnings & Withdrawals</h3>
                    <p className="text-gray-600">
                      Track your project earnings, view payment history, and request withdrawals when ready.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-partner-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-8 h-8 text-partner-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Team Communication</h3>
                    <p className="text-gray-600">
                      Stay connected with our team through the messaging system and receive project updates.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-partner-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="w-8 h-8 text-partner-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Sub-Partner Management</h3>
                    <p className="text-gray-600">
                      Manage your sub-partners, track their performance, and oversee their project contributions.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-partner-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-8 h-8 text-partner-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Schedule & Deadlines</h3>
                    <p className="text-gray-600">
                      Keep track of project deadlines, schedule work sessions, and manage your workload efficiently.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Partner Types Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Partner Network</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Supporting different types of creative professionals in our ecosystem.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
            >
              <motion.div variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-partner-primary">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <Video className="w-10 h-10 text-partner-primary mr-4" />
                      <div>
                        <h3 className="text-2xl font-semibold">Video Editors</h3>
                        <p className="text-gray-500">Creative Content Specialists</p>
                      </div>
                    </div>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        Project assignment and management
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        Real-time collaboration tools
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        Performance tracking and analytics
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        Automated payment processing
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-partner-primary">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <Palette className="w-10 h-10 text-partner-primary mr-4" />
                      <div>
                        <h3 className="text-2xl font-semibold">Theme Page Owners</h3>
                        <p className="text-gray-500">Social Media Managers</p>
                      </div>
                    </div>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        Content scheduling and management
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        Engagement tracking and reporting
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        Sub-partner network management
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        Revenue sharing and analytics
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Quick Access Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Quick Access</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Jump straight to the tools and features you use most.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
            >
              <motion.div variants={fadeInUp}>
                <Button asChild className="w-full h-24 bg-white border-2 border-partner-primary text-partner-primary hover:bg-partner-primary hover:text-white transition-all duration-300">
                  <Link to="/login" className="flex flex-col items-center justify-center">
                    <Briefcase className="w-6 h-6 mb-2" />
                    <span className="font-semibold">Projects</span>
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Button asChild className="w-full h-24 bg-white border-2 border-partner-primary text-partner-primary hover:bg-partner-primary hover:text-white transition-all duration-300">
                  <Link to="/login" className="flex flex-col items-center justify-center">
                    <DollarSign className="w-6 h-6 mb-2" />
                    <span className="font-semibold">Earnings</span>
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Button asChild className="w-full h-24 bg-white border-2 border-partner-primary text-partner-primary hover:bg-partner-primary hover:text-white transition-all duration-300">
                  <Link to="/login" className="flex flex-col items-center justify-center">
                    <MessageSquare className="w-6 h-6 mb-2" />
                    <span className="font-semibold">Messages</span>
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Button asChild className="w-full h-24 bg-white border-2 border-partner-primary text-partner-primary hover:bg-partner-primary hover:text-white transition-all duration-300">
                  <Link to="/login" className="flex flex-col items-center justify-center">
                    <BarChart3 className="w-6 h-6 mb-2" />
                    <span className="font-semibold">Analytics</span>
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-partner-primary to-partner-secondary text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <motion.div 
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Access your partner dashboard and start managing your projects today.
            </p>
            <Button asChild size="lg" variant="secondary" className="bg-white text-partner-primary hover:bg-gray-100 px-8 py-4 text-lg">
              <Link to="/login">
                <LogIn className="w-5 h-5 mr-2" />
                Login to Dashboard
              </Link>
            </Button>
          </motion.div>
        </section>
      </main>
    </div>
  );
};

export default Index;
