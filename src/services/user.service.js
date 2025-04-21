import { db } from '../../config/firebase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class UserService {
  constructor() {
    this.collection = db.collection('users');
    this.formCollection = db.collection('counsellingForms');
    this.registrationForm = db.collection('registrationForm');
  }
  async createUser(userData) {
    try {
      const user = {
        name: userData.name,
        phone: userData.phone,
        isPremium: false,
        createdAt: new Date(),
        premiumPlan: null,
        hasLoggedIn: true
      };
      const snapshot = await this.collection.where('phone', '==', user.phone).get();
      if (!snapshot.empty) {
        throw new Error('User With this phone number already exists');
      }
      const docRef = await this.collection.add(user);
      return { id: docRef.id, ...user };
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  async sendOTPForPremiumLogin(phone) {
    try {
      const snapshot = await this.collection
        .where("phone", "==", phone.toString())
        .get();
        
      if (snapshot.empty) {
        throw new Error('User not found');
      }
      
      const doc = snapshot.docs[0];
      const userData = doc.data();
      
      if (userData.isPremium) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);
        
        await this.collection.doc(doc.id).update({
          otp,
          otpExpiry
        });
        
        // TODO: Implement actual SMS service
        console.log(`SMS to ${phone}: Your verification code is: ${otp}`);
        
        return true;
      }
      return false;
    } catch (error) {
      throw new Error(`Error sending OTP: ${error.message}`);
    }
  }
  
  async login(phone, password = null) {
    try {
      const snapshot = await this.collection
        .where("phone", "==", phone.toString())
        .get();
        
      if (snapshot.empty) {
        throw new Error('User not found');
      }
      
      const doc = snapshot.docs[0];
      const userData = doc.data();
      
      if (userData.isPremium) {
        if (!password) {
          throw new Error('Password required for premium users');
        }
        const passMatch = await bcrypt.compare(password, userData.password);
        if(!passMatch) {
          throw new Error('Invalid password');
        }
        await this.collection.doc(doc.id).update({
          hasLoggedIn: true
        });
      } else {
        if (userData.hasLoggedIn) {
          throw new Error('User already logged in on another device');
        }
        
        await this.collection.doc(doc.id).update({
          hasLoggedIn: true
        });
      }

      const token = jwt.sign({ id: doc.id, phone }, process.env.USER_JWT);
      
      return { id: doc.id, ...userData, token };
    } catch (error) {
      throw new Error(`Error during login: ${error.message}`);
    }
  }

  async logout(userId) {
    try {
      await this.collection.doc(userId).update({
        hasLoggedIn: false
      });
    } catch (error) {
      throw new Error(`Error during logout: ${error.message}`);
    }
  }
  
  async getUserById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        throw new Error('User not found');
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Error getting user: ${error.message}`);
    }
  }
  async getUserByPhone(phone) {
    try {
      
      const snapshot = await this.collection.where('phone', '==', phone).get();
      if (snapshot.empty) {
        throw new Error('User not found');
      }
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Error getting user: ${error.message}`);
    }
  }
  async updatePremiumPlan(userId, planData) {
    try {
      const premiumPlan = {
        planTitle: planData.planTitle,
        purchasedDate: new Date(),
        expiryDate: planData.expiryDate,
      };

      const password = planData.registrationData.confirmPassword;
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      planData.registrationData.password = hashedPassword;
      planData.registrationData.confirmPassword = null;

      await this.collection.doc(userId).update({
        isPremium: true,
        premiumPlan,
        counsellingData: planData.registrationData,
        password: hashedPassword
      });

      return this.getUserById(userId);
    } catch (error) {
      throw new Error(`Error updating premium plan: ${error.message}`);
    }
  }
  async updateCounsellingData(userId, registrationData) {
    try {
      await this.collection.doc(userId).update({
        counsellingData: registrationData,
      });
      return this.getUserById(userId);
    } catch (error) {
      throw new Error(`Error updating counselling data: ${error.message}`);
    }
  }
  async checkPremiumStatus(userId) {
    try {
      const user = await this.getUserById(userId);
      if (!user.premiumPlan) return user;
    
      const now = new Date();
      const expiryDate = user.premiumPlan.expiryDate.toDate();

      if (expiryDate < now) {
        await this.collection.doc(userId).update({
          isPremium: false
        });
        return this.getUserById(userId);
      }

      return user;
    } catch (error) {
      throw new Error(`Error checking premium status: ${error.message}`);
    }
  }
  async checkPremiumStatusByPhone(phone) {
    try {
      const user = await this.getUserByPhone(phone);
      if (!user.premiumPlan) return {
        isPremium: false
      };

      const now = new Date();
      const expiryDate = user.premiumPlan.expiryDate.toDate();

      

      if (expiryDate < now) {
        await this.collection.doc(user.id).update({
          isPremium: false
        });
        return {
          isPremium: false
        };
      }

      return {
        isPremium: true
      };
    } catch (error) {
      throw new Error(`Error checking premium status: ${error.message}`);
    }
  }

  async createFormSteps(formData) {
    try {
      const form = {
        steps: formData.steps.map(step => ({
          number: step.number,
          title: step.title,
          status: step.status || null
        }))
      };
      const docRef = await this.formCollection.add(form);
      return { id: docRef.id, ...form };
    } catch (error) {
      throw new Error(`Error creating form steps: ${error.message}`);
    }
  }

  async getFormSteps() {
    try {
      const snapshot = await this.formCollection.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error getting form steps: ${error.message}`);
    }
  }

  async getFormStepsById(formId) {
    try {
      const doc = await this.formCollection.doc(formId).get();
      if (!doc.exists) {
        throw new Error('Form not found');
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Error getting form steps: ${error.message}`);
    }
  }

  async updateFormSteps(formId, updateData) {
    try {
      await this.formCollection.doc(formId).update({
        steps: updateData.steps
      });
      return this.getFormStepsById(formId);
    } catch (error) {
      throw new Error(`Error updating form steps: ${error.message}`);
    }
  }

  async deleteFormSteps(formId) {
    try {
      await this.formCollection.doc(formId).delete();
      return { id: formId, message: 'Form deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting form steps: ${error.message}`);
    }
  }

  async setUserFormData(phone, formSteps) {
    try {
      const user = await this.getUserByPhone(phone);
      if (!user) throw new Error('User not found');

      // Get generic form data
      const formDoc = await this.formCollection.doc(formSteps.id).get();
      if (!formDoc.exists) throw new Error('Form template not found');

      const genericForm = formDoc.data();
      
      // Merge generic steps with user data
      const mergedSteps = genericForm.steps.map(genericStep => {
        const userStep = formSteps.steps.find(s => s.number === genericStep.number);
        return {
          ...genericStep,
          data: userStep?.data || null,
          status: userStep?.status || genericStep.status || null
        };
      });

      // Update user's stepsData
      await this.collection.doc(user.id).update({
        stepsData: {
          id: formSteps.id,
          steps: mergedSteps
        }
      });

      return { id: formSteps.id, steps: mergedSteps };
    } catch (error) {
      throw new Error(`Error setting user form data: ${error.message}`);
    }
  }

  async getUserFormData(phone, formId) {
    try {
      const user = await this.getUserByPhone(phone);
      if (!user) throw new Error('User not found');

      // Get generic form data
      const formDoc = await this.formCollection.doc(formId).get();
      if (!formDoc.exists) throw new Error('Form template not found');

      const genericForm = formDoc.data();
      const userData = user.stepsData;

      if (!userData || userData.id !== formId) {
        return { id: formId, steps: genericForm.steps };
      }

      // Merge generic form with user data
      const mergedSteps = genericForm.steps.map(genericStep => {
        const userStep = userData.steps.find(s => s.number === genericStep.number);
        console.log( {
          ...genericStep,
          data: userStep?.data || null,
          status: userStep?.status || genericStep.status || null,
          ...userStep
        });
        
        return {
          ...genericStep,
          data: userStep?.data || null,
          status: userStep?.status || genericStep.status || null,
          ...userStep
        };
      });

      return { id: formId, steps: mergedSteps };
    } catch (error) {
      throw new Error(`Error getting user form data: ${error.message}`);
    }
  }

  async updateUserFormData(phone, formId, updatedSteps) {
    try {
      const user = await this.getUserByPhone(phone);
      if (!user) throw new Error('User not found');

      // Get generic form data to validate step numbers
      const formDoc = await this.formCollection.doc(formId).get();
      if (!formDoc.exists) throw new Error('Form template not found');
      
      const genericForm = formDoc.data();
      
      // Convert step numbers to numbers and validate
      const validStepNumbers = new Set(genericForm.steps.map(s => s.number));
      const processedSteps = updatedSteps.map(step => ({
        ...step,
        number: parseInt(step.number) // Convert to number
      }));
      
      const invalidSteps = processedSteps.filter(s => !validStepNumbers.has(s.number));
      if (invalidSteps.length > 0) {
        throw new Error(`Invalid step numbers: ${invalidSteps.map(s => s.number).join(', ')}`);
      }

      // Get current user form data or initialize if doesn't exist
      const currentUserData = user.stepsData?.id === formId ? 
        user.stepsData : 
        { id: formId, steps: genericForm.steps };

      // Update only user-specific fields (status and remark) for provided steps
      const mergedSteps = currentUserData.steps.map(currentStep => {
        const updatedStep = processedSteps.find(s => s.number === currentStep.number);
        if (!updatedStep) return currentStep;

        return {
          ...currentStep,
          ...updatedStep,
          number: currentStep.number, 
          status: updatedStep.status || null,
          remark: updatedStep.remark || null // Add remark field
        };
      });

      // Update user's stepsData with clean data
      const updateData = {
        stepsData: {
          id: formId,
          steps: mergedSteps
        }
      };

      console.dir(updatedSteps, {depth: null});
      

      await this.collection.doc(user.id).update(updateData);
      return { id: formId, steps: mergedSteps };
    } catch (error) {
      throw new Error(`Error updating user form data: ${error.message}`);
    }
  }

  async getUserLists(id) {
    try {
      const user = await this.getUserById(id);
      if (!user) throw new Error('User not found');
      return user.lists ?? []
    } catch (error) {
      throw new Error(`Error getting form steps: ${error.message}`);
    }
  }

  async getRegistrationForm(userId) {
    try {      
      const user = await this.getUserById(userId);
      const formDoc = await this.registrationForm.doc('Form1').get();
      const formData = formDoc.data();
      if (!formData) throw new Error('Form not found');

      const form = {
        userData : user.counsellingData,
        formData: formData,
      }

      return form?? {}
    } catch (error) {
      throw new Error(`Error getting registration form: ${error.message}`);
    }
  }

}

export default new UserService();