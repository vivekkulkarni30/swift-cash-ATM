// User preferences system for ATM application
export interface UserPreferences {
  showBalance: boolean;
  // Add more preferences here as needed
}

const DEFAULT_PREFERENCES: UserPreferences = {
  showBalance: true,
};

export class UserPreferencesManager {
  private static getStorageKey(accountNumber: number): string {
    return `atm_user_preferences_${accountNumber}`;
  }

  static getPreferences(accountNumber: number): UserPreferences {
    try {
      const stored = localStorage.getItem(this.getStorageKey(accountNumber));
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  }

  static savePreferences(accountNumber: number, preferences: UserPreferences): void {
    try {
      localStorage.setItem(this.getStorageKey(accountNumber), JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  static updatePreference<K extends keyof UserPreferences>(
    accountNumber: number, 
    key: K, 
    value: UserPreferences[K]
  ): void {
    const currentPreferences = this.getPreferences(accountNumber);
    const updatedPreferences = { ...currentPreferences, [key]: value };
    this.savePreferences(accountNumber, updatedPreferences);
  }
}