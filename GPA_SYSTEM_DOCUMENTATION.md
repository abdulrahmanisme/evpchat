# EVP Campus Champions - GPA Evaluation System

## 🎓 **Overview**

The EVP Campus Champions app now features a comprehensive **Credit-Based Growth Evaluation (GPA Model)** that tracks student progress through five core principles. This system maintains the existing UI/theme while adding powerful new functionality for academic-style evaluation and ranking.

## 🏗️ **Database Schema**

### **New Tables Added**

#### 1. `core_principles`
```sql
- id (UUID, Primary Key)
- name (TEXT) - Principle name (e.g., "Ownership", "Innovation")
- description (TEXT) - Detailed description
- max_credits (INTEGER) - Maximum credits possible (default: 100)
- parameters (JSONB) - Principle-specific parameters
- weight (DECIMAL) - Weight in GPA calculation (default: 1.00)
- is_active (BOOLEAN) - Whether principle is active
- created_at, updated_at (TIMESTAMPTZ)
```

#### 2. `growth_evaluations`
```sql
- id (UUID, Primary Key)
- user_id (UUID) - References profiles.id
- principle_id (UUID) - References core_principles.id
- reflection_text (TEXT) - Student's reflection
- effort_score (INTEGER) - 1-5 effort rating
- credits_earned (DECIMAL) - Calculated credits
- status (TEXT) - 'pending', 'verified', 'rejected'
- admin_comments (TEXT) - Admin feedback
- verified_at, verified_by (TIMESTAMPTZ, UUID)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 3. `attendance`
```sql
- id (UUID, Primary Key)
- user_id (UUID) - References profiles.id
- event_name (TEXT) - Name of event
- event_date (DATE) - Date of event
- attendance_type (TEXT) - 'event', 'meeting', 'workshop', 'training'
- credits_earned (DECIMAL) - Credits for attendance
- verified_at, verified_by (TIMESTAMPTZ, UUID)
- created_at (TIMESTAMPTZ)
```

### **Updated `profiles` Table**
```sql
- gpa (DECIMAL) - Calculated GPA (0.00-4.00)
- rank (INTEGER) - Student ranking
- total_credits (DECIMAL) - Total credits earned
- attendance_count (INTEGER) - Number of events attended
```

## 🎯 **Core Principles**

### **1. Ownership** (Weight: 1.00)
- **Description**: Taking responsibility and initiative in campus activities
- **Max Credits**: 100
- **Parameters**: 
  - `attendance_weight`: 0.3 (30% from attendance)
  - `reflection_weight`: 0.7 (70% from reflections)

### **2. Innovation** (Weight: 1.00)
- **Description**: Bringing creative solutions and new ideas
- **Max Credits**: 100
- **Parameters**:
  - `creativity_score`: 0.4 (40% creativity)
  - `implementation_score`: 0.6 (60% implementation)

### **3. Collaboration** (Weight: 1.00)
- **Description**: Working effectively with others
- **Max Credits**: 100
- **Parameters**:
  - `teamwork_score`: 0.5 (50% teamwork)
  - `communication_score`: 0.5 (50% communication)

### **4. Excellence** (Weight: 1.00)
- **Description**: Maintaining high standards and continuous improvement
- **Max Credits**: 100
- **Parameters**:
  - `quality_score`: 0.6 (60% quality)
  - `improvement_score`: 0.4 (40% improvement)

### **5. Impact** (Weight: 1.00)
- **Description**: Creating meaningful change and measurable results
- **Max Credits**: 100
- **Parameters**:
  - `reach_score`: 0.5 (50% reach)
  - `outcome_score`: 0.5 (50% outcomes)

## 📊 **GPA Calculation Logic**

### **Formula**
```
GPA = (Total Weighted Credits / Total Max Weighted Credits) × 4.00
```

### **Credit Calculation**
- **Effort Score to Credits**: `(effort_score - 1) × (max_credits / 4.0)`
  - Score 1 = 0% credits
  - Score 2 = 25% credits
  - Score 3 = 50% credits
  - Score 4 = 75% credits
  - Score 5 = 100% credits

### **Attendance Credits**
- **Event**: 1 credit
- **Meeting**: 2 credits
- **Workshop**: 3 credits
- **Training**: 5 credits

## 🔄 **System Workflow**

### **For Campus Leads**
1. **Submit Growth Evaluations**
   - Select a core principle
   - Rate effort (1-5 stars)
   - Write detailed reflection
   - Submit for admin review

2. **Record Attendance**
   - Log attendance at events
   - Earn credits based on event type
   - Track verification status

3. **View Progress**
   - See current GPA and rank
   - Track total credits earned
   - View evaluation history

### **For Admins**
1. **Review Evaluations**
   - View all submitted reflections
   - Verify or reject submissions
   - Add admin comments
   - Approve credits

2. **Manage System**
   - View GPA leaderboard
   - Track student progress
   - Monitor attendance patterns

### **For Superadmins**
1. **System Oversight**
   - Full access to all data
   - Manage core principles
   - System-wide analytics

## 🎨 **UI Components**

### **Student Dashboard**
- **GPA Dashboard**: Overview cards showing GPA, rank, credits, attendance
- **Growth Evaluation Form**: Submit reflections with effort scoring
- **Attendance Form**: Record event attendance
- **Attendance List**: View attendance history

### **Admin Dashboard**
- **Growth Evaluations Management**: Review and verify submissions
- **GPA Leaderboard**: Rank students by GPA performance
- **Legacy System**: Maintain existing functionality

### **Leaderboard Page**
- **GPA Leaderboard**: New GPA-based rankings
- **Legacy Leaderboard**: Original score-based rankings

## 🔧 **Technical Implementation**

### **Database Functions**
- `calculate_gpa(user_uuid)`: Calculates GPA for a user
- `update_user_gpa_and_rank()`: Trigger function to update GPA/rank
- `calculate_effort_credits(effort_score, max_credits)`: Converts effort to credits

### **Triggers**
- **GPA Update Trigger**: Automatically recalculates GPA when evaluations change
- **Rank Update Trigger**: Updates student rankings based on GPA

### **RLS Policies**
- **Students**: Can view/create their own evaluations and attendance
- **Admins**: Can view/update all evaluations and attendance
- **Superadmins**: Full access to all data

## 📈 **Features**

### **Automatic Calculations**
- ✅ GPA updates automatically when evaluations are verified
- ✅ Rankings update based on GPA performance
- ✅ Credits calculated from effort scores
- ✅ Attendance contributes to Ownership principle

### **Flexible Evaluation**
- ✅ Multiple core principles with different weights
- ✅ Effort-based scoring (1-5 scale)
- ✅ Admin verification system
- ✅ Detailed reflection requirements

### **Comprehensive Tracking**
- ✅ Event attendance logging
- ✅ Credit-based progress tracking
- ✅ GPA-style academic evaluation
- ✅ Real-time leaderboard updates

## 🚀 **Future Enhancements**

### **AI Integration** (Optional)
- AI-powered reflection analysis
- Automated effort score suggestions
- Intelligent feedback generation
- Predictive GPA modeling

### **Advanced Analytics**
- Campus-wise performance comparison
- Trend analysis over time
- Achievement badges and milestones
- Export capabilities for reports

## 📋 **Migration Instructions**

1. **Run Database Migration**:
   ```sql
   -- Execute: supabase/migrations/20250123000003_gpa_evaluation_system.sql
   ```

2. **Update TypeScript Types**:
   - New tables added to `src/integrations/supabase/types.ts`

3. **Deploy Components**:
   - All GPA components are ready to use
   - Existing UI/theme preserved
   - Legacy system maintained alongside

## 🎯 **Benefits**

- **Academic-Style Evaluation**: Familiar GPA system for students
- **Comprehensive Tracking**: Multiple evaluation dimensions
- **Flexible System**: Easy to add new principles or modify weights
- **Admin Control**: Full verification and management capabilities
- **Backward Compatibility**: Legacy system preserved
- **Scalable Architecture**: Ready for future enhancements

The GPA system transforms EVP Campus Champions into a comprehensive academic evaluation platform while maintaining the existing user experience and visual design.
