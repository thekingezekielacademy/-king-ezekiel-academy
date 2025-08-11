import React from 'react';
import { FaGraduationCap, FaUsers, FaStar, FaClock, FaAward, FaHeart, FaLightbulb, FaHandshake } from 'react-icons/fa';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About King Ezekiel Academy
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Building the foundation for tomorrow's leaders with quality education and innovative learning experiences.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              At King Ezekiel Academy, we believe in the transformative power of education. 
              Our mission is to empower students with the knowledge, skills, and confidence 
              they need to succeed in the digital age.
            </p>
            <p className="text-gray-600 mb-6">
              We strive to create an inclusive learning environment where every student can 
              discover their potential, develop critical thinking skills, and build a strong 
              foundation for their future careers.
            </p>
            <div className="flex items-center space-x-4">
              <FaHeart className="h-8 w-8 text-primary-600" />
              <span className="text-lg font-semibold text-gray-900">Passion for Education</span>
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
            <p className="text-gray-600 mb-6">
              We envision a world where quality education is accessible to everyone, regardless 
              of their background or circumstances. Our goal is to become a leading institution 
              in digital skills education.
            </p>
            <p className="text-gray-600 mb-6">
              Through innovative teaching methods, cutting-edge technology, and a commitment 
              to excellence, we aim to shape the next generation of digital professionals and 
              thought leaders.
            </p>
            <div className="flex items-center space-x-4">
              <FaLightbulb className="h-8 w-8 text-primary-600" />
              <span className="text-lg font-semibold text-gray-900">Innovation & Excellence</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FaGraduationCap className="h-12 w-12 text-primary-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">10,000+</div>
            <div className="text-gray-600">Students Taught</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FaUsers className="h-12 w-12 text-primary-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
            <div className="text-gray-600">Expert Instructors</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FaStar className="h-12 w-12 text-primary-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">4.9/5</div>
            <div className="text-gray-600">Student Rating</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FaAward className="h-12 w-12 text-primary-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">95%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaGraduationCap className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Excellence</h3>
              <p className="text-gray-600">
                We maintain the highest standards in education and continuously strive for 
                excellence in everything we do.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaHandshake className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Integrity</h3>
              <p className="text-gray-600">
                We conduct ourselves with honesty, transparency, and ethical behavior in 
                all our interactions.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community</h3>
              <p className="text-gray-600">
                We foster a supportive learning community where everyone feels valued, 
                respected, and empowered to succeed.
              </p>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Our Journey – From Vision to Impact</h2>
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold text-primary-900 mb-2">2021 – Humble Beginnings</h3>
              <p className="text-gray-700 leading-relaxed">
                In 2021, I began my professional journey at Hagital Consulting, where the CEO, Pastor Yomi Omiyale, and his wife, Mrs. Debra Omiyale, welcomed me as an intern. Under their mentorship, I gained hands-on experience in Digital Marketing, E-commerce, and Information Marketing. This period laid the foundation for my skills and work ethic, and it remains one of the most formative seasons of my life.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-900 mb-2">2022 – Stepping Out in Faith</h3>
              <p className="text-gray-700 leading-relaxed">
                After a full year of learning, I felt called to pursue my own path. With nothing but a vision to enlighten and educate, I left Hagital Consulting with heartfelt goodbyes and a deep belief that knowledge is light and many are in darkness. That same year, God gave me a dream, and I created my first set of courses, including Digital Marketing 101, which sold over 20,000 digital copies in 2022 alone.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-900 mb-2">2022 – 2024 – Building Momentum</h3>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>Over the next two years, I developed over 40 practical courses and sold more than 60,000 copies to 40,000+ students, generating tens of millions in revenue.</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Trained over 10,000 people for free via Telegram & WhatsApp through the K.E. Development Movement.</li>
                  <li>Grew my Telegram channel to 8,000 active subscribers.</li>
                  <li>Reached over 500,000 views on YouTube with 9,000+ subscribers (all students).</li>
                  <li>Spent over ₦15 million on advertisements, reaching 5.7 million people across Nigeria.</li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-900 mb-2">2025 – A Bigger Vision</h3>
              <p className="text-gray-700 leading-relaxed">
                Even after all these milestones, I saw a gap in the educational sector. People don’t just need affordable, high-quality knowledge — they also need a space to ask questions, connect with mentors, and grow together. This led me to design my next chapter: affordable, precise, and practical education with ongoing support for every learner — The King Ezekiel Academy.
              </p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Leadership Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Dr. Sarah Johnson</h3>
              <p className="text-primary-600 mb-4">Founder & CEO</p>
              <p className="text-gray-600 text-sm">
                Education expert with 15+ years of experience in digital learning and 
                curriculum development.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Michael Chen</h3>
              <p className="text-primary-600 mb-4">Chief Technology Officer</p>
              <p className="text-gray-600 text-sm">
                Tech innovator passionate about creating cutting-edge learning platforms 
                and digital experiences.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Emily Rodriguez</h3>
              <p className="text-primary-600 mb-4">Head of Education</p>
              <p className="text-gray-600 text-sm">
                Curriculum specialist dedicated to developing engaging, effective learning 
                experiences for all students.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
