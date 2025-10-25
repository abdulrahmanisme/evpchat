# 📋 EVP Campus Champions - Product Requirements Document (PRD)

## 🎯 **Product Overview**

**Product Name:** EVP Campus Champions  
**Tagline:** "Campus Lead Chartbusters"  
**Purpose:** Track campus leadership journey, document contributions, and create competitive leaderboards  
**Target Users:** Campus leads, administrators, and super administrators  

---

## 🏗️ **System Architecture**

### **Technology Stack:**
- **Frontend:** React 18 + TypeScript + Vite
- **UI Framework:** shadcn/ui + Radix UI + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State Management:** TanStack Query (React Query)
- **Routing:** React Router DOM
- **Forms:** React Hook Form + Zod validation
- **Notifications:** Sonner toast notifications
- **Charts:** Recharts
- **Animations:** Framer Motion
- **AI Integration:** Google Gemini API

### **Database Schema:**
- **profiles** - User profiles and basic information
- **user_roles** - Role-based access control (admin, campus_lead, superadmin)
- **reflections** - Structured reflection submissions
- **reflection_questions** - Predefined questions by principle
- **user_gpa** - Computed GPA scores and rankings
- **submissions** - Legacy submission system (deprecated)

---

## 👥 **User Roles & Permissions**

### **1. Campus Lead (Primary User)**
- **Access:** Dashboard, Leaderboard, Reflection submissions
- **Capabilities:**
  - Submit structured reflections
  - View personal progress and rankings
  - Access campus-specific leaderboard
  - View AI-powered feedback

### **2. Admin**
- **Access:** Admin dashboard, user management, reflection reviews
- **Capabilities:**
  - Review and verify reflection submissions
  - Manage campus leads
  - View detailed AI evaluations
  - Access admin-specific analytics

### **3. Superadmin**
- **Access:** Full system control, user management, system analytics
- **Capabilities:**
  - Manage all users (campus leads + admins)
  - System-wide analytics and reporting
  - Full reflection submission oversight
  - Advanced user role management

---

## 🚀 **Core Features**

### **1. Authentication & Authorization**
- **Supabase Auth integration**
- **Role-based access control (RBAC)**
- **Secure login/logout functionality**
- **Protected routes based on user roles**

### **2. Campus Lead Dashboard**
- **Modern wireframe-based design**
- **3-card top row layout:**
  - Campus Lead Profile card
  - Pie Chart showing stats
  - Attendance and Days attended
- **2-card bottom row layout:**
  - Events card (clickable button)
  - Start Reflections card (clickable button)
- **Interactive reflection dialog system**
- **Compulsory question validation**

### **3. Structured Reflection System**
- **5 Core Principles:**
  - Ownership
  - Learning by Doing
  - Collaboration
  - Innovation
  - Impact
- **3 questions per principle (15 total)**
- **Compulsory validation** - All questions must be answered
- **Visual feedback** - Red/green indicators for completion
- **Progress tracking** - Dots showing completion status
- **Navigation controls** - Previous/Next buttons

### **4. AI-Powered Evaluation**
- **Google Gemini API integration**
- **Real-time reflection analysis**
- **Detailed scoring system:**
  - Effort Score (0-10)
  - Quality Score (0-10)
  - Credit Value calculation
- **AI reasoning and feedback**
- **Fallback to rule-based analysis**

### **5. Leaderboard System**
- **Reflection-based rankings**
- **GPA calculation and display**
- **Campus-specific leaderboards**
- **Real-time updates**

### **6. Admin Management**
- **Admin Dashboard with tabs:**
  - Overview (statistics)
  - Reflection Submissions (detailed view)
  - Campus Management
- **Detailed AI evaluation viewing**
- **User management capabilities**

### **7. Superadmin Control**
- **Superadmin Dashboard with tabs:**
  - Overview (system-wide stats)
  - Users (campus lead management)
  - Admins (admin user management)
  - Reflections (all submissions)
- **System-wide analytics**
- **Advanced user role management**

---

## 📱 **User Interface Features**

### **1. Modern Design System**
- **shadcn/ui component library**
- **Consistent color scheme and typography**
- **Responsive design for all screen sizes**
- **Accessibility compliance**

### **2. Interactive Elements**
- **Animated cards with hover effects**
- **Progress indicators and loading states**
- **Toast notifications for user feedback**
- **Modal dialogs for complex interactions**

### **3. Data Visualization**
- **Pie charts for statistics**
- **Bar charts for attendance data**
- **Progress bars for completion tracking**
- **Color-coded status indicators**

---

## 🔧 **Technical Features**

### **1. Edge Functions**
- **evaluate-reflection** - AI-powered reflection analysis
- **CORS handling** for cross-origin requests
- **Error handling and fallback mechanisms**

### **2. Database Features**
- **Row Level Security (RLS)**
- **Automated triggers for GPA calculation**
- **Optimized queries with joins**
- **Data validation and constraints**

### **3. State Management**
- **React Query for server state**
- **Local state for UI interactions**
- **Optimistic updates for better UX**
- **Error boundary implementation**

---

## 📊 **Analytics & Reporting**

### **1. Campus Lead Analytics**
- **Personal reflection history**
- **Progress tracking over time**
- **GPA trends and improvements**
- **Attendance statistics**

### **2. Admin Analytics**
- **Campus-specific statistics**
- **Reflection submission rates**
- **AI evaluation accuracy**
- **User engagement metrics**

### **3. Superadmin Analytics**
- **System-wide statistics**
- **Cross-campus comparisons**
- **Performance trends**
- **User activity monitoring**

---

## 🔒 **Security & Compliance**

### **1. Authentication Security**
- **Supabase Auth with JWT tokens**
- **Secure password policies**
- **Session management**
- **Role-based access control**

### **2. Data Protection**
- **Row Level Security (RLS)**
- **Input validation and sanitization**
- **SQL injection prevention**
- **XSS protection**

### **3. API Security**
- **CORS configuration**
- **Rate limiting**
- **API key management**
- **Error handling without data exposure**

---

## 🎯 **User Journey Flows**

### **Campus Lead Journey:**
1. **Landing Page** → Sign In/Apply
2. **Authentication** → Dashboard Access
3. **Dashboard** → View Profile & Stats
4. **Start Reflections** → Complete 5 Principles
5. **AI Evaluation** → Receive Feedback
6. **Leaderboard** → View Rankings

### **Admin Journey:**
1. **Admin Login** → Dashboard Access
2. **Review Submissions** → Verify Reflections
3. **Manage Users** → Campus Lead Oversight
4. **Analytics** → Performance Monitoring

### **Superadmin Journey:**
1. **Superadmin Login** → Full System Access
2. **User Management** → Manage All Users
3. **System Analytics** → Monitor Performance
4. **Reflection Oversight** → Review All Submissions

---

## 🚀 **Deployment & Infrastructure**

### **1. Frontend Deployment**
- **Vite build system**
- **Static asset optimization**
- **Environment variable management**
- **CDN integration**

### **2. Backend Infrastructure**
- **Supabase hosted PostgreSQL**
- **Edge Functions for AI processing**
- **Real-time subscriptions**
- **Automatic scaling**

### **3. Monitoring & Maintenance**
- **Error tracking and logging**
- **Performance monitoring**
- **Database optimization**
- **Regular security updates**

---

## 📈 **Success Metrics**

### **1. User Engagement**
- **Reflection submission rates**
- **User retention metrics**
- **Session duration**
- **Feature adoption rates**

### **2. System Performance**
- **AI evaluation accuracy**
- **Response times**
- **Uptime metrics**
- **Error rates**

### **3. Business Impact**
- **Campus lead participation**
- **Admin efficiency gains**
- **System scalability**
- **User satisfaction scores**

---

## 🔮 **Future Roadmap**

### **Phase 1 (Current)**
- ✅ Core reflection system
- ✅ AI-powered evaluation
- ✅ Basic leaderboard
- ✅ Admin management

### **Phase 2 (Planned)**
- 🔄 Advanced analytics dashboard
- 🔄 Peer review system
- 🔄 Mobile app development
- 🔄 Integration with external systems

### **Phase 3 (Future)**
- 🔮 Machine learning improvements
- 🔮 Advanced reporting features
- 🔮 Multi-language support
- 🔮 Enterprise features

---

## 📋 **Current Status**

### **✅ Completed Features:**
- Complete authentication system
- Structured reflection submission system
- AI-powered evaluation with Gemini
- Admin and Superadmin dashboards
- Compulsory question validation
- Modern UI with wireframe design
- Leaderboard system
- User management capabilities

### **🔄 In Progress:**
- Performance optimization
- Enhanced error handling
- Mobile responsiveness improvements

### **📝 Known Issues:**
- None currently reported
- System is fully functional

---

## 🎉 **Conclusion**

EVP Campus Champions is a comprehensive campus leadership tracking system that combines modern web technologies with AI-powered evaluation to create an engaging and competitive platform for campus leads. The system provides structured reflection opportunities, real-time feedback, and comprehensive management tools for administrators.

The application successfully balances user experience with administrative control, ensuring that campus leads can easily submit reflections while administrators have the tools they need to manage and evaluate submissions effectively.

**Current Status: Fully Functional and Production-Ready** ✅
