/**
 * Haptic Feedback для Telegram Web App
 * Создает тактильную обратную связь при взаимодействии с интерфейсом
 */

export enum HapticFeedbackType {
  ImpactLight = 'light',
  ImpactMedium = 'medium',
  ImpactHeavy = 'heavy',
  NotificationSuccess = 'success',
  NotificationWarning = 'warning',
  NotificationError = 'error',
  SelectionChange = 'selection'
}

export const hapticFeedback = (type: HapticFeedbackType = HapticFeedbackType.ImpactLight) => {
  if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
    return;
  }

  try {
    const webApp = window.Telegram.WebApp;
    
    // Проверяем доступность haptic feedback
    if (webApp.HapticFeedback) {
      switch (type) {
        case HapticFeedbackType.ImpactLight:
          webApp.HapticFeedback.impactOccurred('light');
          break;
        case HapticFeedbackType.ImpactMedium:
          webApp.HapticFeedback.impactOccurred('medium');
          break;
        case HapticFeedbackType.ImpactHeavy:
          webApp.HapticFeedback.impactOccurred('heavy');
          break;
        case HapticFeedbackType.NotificationSuccess:
          webApp.HapticFeedback.notificationOccurred('success');
          break;
        case HapticFeedbackType.NotificationWarning:
          webApp.HapticFeedback.notificationOccurred('warning');
          break;
        case HapticFeedbackType.NotificationError:
          webApp.HapticFeedback.notificationOccurred('error');
          break;
        case HapticFeedbackType.SelectionChange:
          webApp.HapticFeedback.selectionChanged();
          break;
      }
    }
  } catch (error) {
    // Игнорируем ошибки если haptic feedback не поддерживается
    console.debug('Haptic feedback not available:', error);
  }
};

// Удобные функции для частых случаев
export const hapticLight = () => hapticFeedback(HapticFeedbackType.ImpactLight);
export const hapticMedium = () => hapticFeedback(HapticFeedbackType.ImpactMedium);
export const hapticHeavy = () => hapticFeedback(HapticFeedbackType.ImpactHeavy);
export const hapticSuccess = () => hapticFeedback(HapticFeedbackType.NotificationSuccess);
export const hapticWarning = () => hapticFeedback(HapticFeedbackType.NotificationWarning);
export const hapticError = () => hapticFeedback(HapticFeedbackType.NotificationError);
export const hapticSelection = () => hapticFeedback(HapticFeedbackType.SelectionChange);

