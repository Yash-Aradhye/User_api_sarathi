import UserService from '../services/user.service.js';

class UserController {
  // Create new user
  async createUser(req, res) {
    try {
      const { name, phone } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
      }
      
      const user = await UserService.createUser({ name, phone });
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const user = await UserService.getUserById(req.params.id);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Get user by phone
  async getUserByPhone(req, res) {
    try {
      const user = await UserService.getUserByPhone(req.params.phone);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Update premium plan
  async updateCounsellingData(req, res) {
    try {
      const { registrationData } = req.body;
      if (!registrationData) {
        return res.status(400).json({ error: 'data is required' });
      }

      const user = await UserService.updateCounsellingData(req.params.id,
        registrationData
      );
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  async updatePremiumPlan(req, res) {
    try {
      const { planTitle, expiryDate, registrationData } = req.body;
      if (!planTitle || !expiryDate) {
        return res.status(400).json({ error: 'Plan title and expiry date are required' });
      }

      const user = await UserService.updatePremiumPlan(req.params.id, {
        planTitle,
        expiryDate: new Date(expiryDate),
        registrationData
      });
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Check premium status
  async checkPremiumStatus(req, res) {
    try {
      const user = await UserService.checkPremiumStatus(req.params.id);
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  // Check premium status
  async checkPremiumStatusByPhone(req, res) {
    try {
      const user = await UserService.checkPremiumStatusByPhone(req.body.phone);
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async sendOTP(req, res) {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }
      
      await UserService.sendOtp(phone);
      res.status(200).json({
        success: true
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Login
  async login(req, res) {
    try {
      const { phone, password } = req.body;
      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }
      
      const user = await UserService.login(phone, password);
      res.status(200).json(user);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req, res) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      await UserService.logout(userId);
      res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async setUserFormData(req, res) {
    try {
      const { phone, formSteps } = req.body;
      if (!phone || !formSteps) {
        return res.status(400).json({ error: 'Phone number and form steps are required' });
      }
      const updatedData = await UserService.setUserFormData(phone, formSteps);
      res.status(200).json(updatedData);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUserFormData(req, res) {
    try {
      const { phone, formId } = req.params;
      if (!phone || !formId) {
        return res.status(400).json({ error: 'Phone number and form ID are required' });
      }
      const formData = await UserService.getUserFormData(phone, formId);
      res.status(200).json(formData);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async createFormSteps(req, res) {
    try {
      const form = await UserService.createFormSteps(req.body);
      res.status(201).json(form);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getFormSteps(req, res) {
    try {
      const forms = await UserService.getFormSteps();
      res.status(200).json(forms);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getFormStepsById(req, res) {
    try {
      const form = await UserService.getFormStepsById(req.params.id);
      res.status(200).json(form);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateFormSteps(req, res) {
    try {
      const form = await UserService.updateFormSteps(req.params.id, req.body);
      res.status(200).json(form);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteFormSteps(req, res) {
    try {
      const result = await UserService.deleteFormSteps(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateUserFormData(req, res) {
    try {
      const { phone, formId } = req.params;
      const { steps } = req.body;

      
      
      if (!phone || !formId || !steps) {
        return res.status(400).json({ 
          error: 'Phone number, form ID and steps data are required' 
        });
      }

      const formData = await UserService.updateUserFormData(phone, formId, steps);
      res.status(200).json(formData);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUserLists(req, res) {
    try {
      const {id} = req.user
      const lists = await UserService.getUserLists(id);
      res.status(200).json(lists);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  async getRegistrationForm(req, res) {
    try {
      const {id} = req.user
      
      const form = await UserService.getRegistrationForm(id);
      res.status(200).json(form);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  async getLandingPageData(req, res) {
    try {      
      const data = await UserService.getLandingPageData();
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  async updateName(req, res) {
    try {
      const { name, phone, email } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      const user = await UserService.updateName(phone, name, email);
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async verifyPhone(req, res) {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP are required' });
      }
      
      const user = await UserService.verifyPhone(phone, otp);
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new UserController();