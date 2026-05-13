import { Platform } from 'react-native';
import { ScreenTimeService } from '../services/screentime/ScreenTimeService';
import { GoalType, AppCategory, TimeBlock } from '../models';

/**
 * Returns a handler that translates a GoalChatInterface tool result into a
 * createGoal payload. On iOS + app_limit goals it presents FamilyActivityPicker
 * first; on Android it passes bundle IDs directly.
 */
export function buildGoalPayload(
  toolName: string,
  toolInput: Record<string, unknown>,
  iosActivitySelection?: string | null
) {
  if (toolName === 'create_app_limit_goal') {
    return {
      naturalLanguageInput: '',
      claudeInterpretation:
        (toolInput.claudeExplanation as string) ?? 'App usage limit',
      goalType: 'app_limit' as GoalType,
      // Android uses bundle IDs; iOS uses opaque FamilyActivitySelection
      targetApps: Platform.OS === 'android'
        ? (toolInput.targetBundleIds as string[]) ?? []
        : [],
      targetCategories: (toolInput.targetCategories as AppCategory[]) ?? [],
      dailyLimitSeconds: (toolInput.dailyLimitSeconds as number) ?? 3600,
      iosActivitySelection: iosActivitySelection ?? undefined,
    };
  }

  if (toolName === 'create_time_block') {
    return {
      naturalLanguageInput: '',
      claudeInterpretation:
        (toolInput.claudeExplanation as string) ?? 'Time block',
      goalType: 'bedtime_block' as GoalType,
      scheduledBlocks: (toolInput.scheduledBlocks as TimeBlock[]) ?? [],
    };
  }

  return null;
}

/**
 * On iOS, presents FamilyActivityPicker for app_limit goals.
 * Returns the encoded selection string, or null if not needed / cancelled.
 */
export async function requestIOSAppSelection(toolName: string): Promise<string | null> {
  if (Platform.OS !== 'ios') return null;
  if (toolName !== 'create_app_limit_goal') return null;
  return ScreenTimeService.presentAppPicker();
}
