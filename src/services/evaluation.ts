import { type Account, AccountService } from "@/stores/account/types";
import type { Period } from "./shared/Period";
import {useEvaluationStore} from "@/stores/evaluation";
import {Evaluation} from "@/services/shared/Evaluation";
import {error} from "@/utils/logger/logger";
import {getFeatureAccount} from "@/utils/multiservice";
import {MultiServiceFeature} from "@/stores/multiService/types";

const getDefaultPeriod = (periods: Period[]): string => {
  const now = Date.now();
  const currentPeriod = periods.find((p) => p.startTimestamp &&p.endTimestamp && p.startTimestamp <= now && p.endTimestamp >= now) || periods.at(0) ;
  return currentPeriod!.name;
};

export async function updateEvaluationPeriodsInCache <T extends Account> (account: T): Promise<void> {
  let periods: Period[] = [];
  let defaultPeriod: string|null = null;

  switch (account.service) {
    case AccountService.Pronote: {
      const { getEvaluationsPeriods } = await import("./pronote/evaluations");
      const output = getEvaluationsPeriods(account);

      periods = output.periods;
      defaultPeriod = output.default;

      break;
    }
    case AccountService.PapillonMultiService: {
      const service = getFeatureAccount(MultiServiceFeature.Evaluations, account.localID);
      if (!service) {
        throw new Error("No service set in multi-service space");
      }
      return await updateEvaluationPeriodsInCache(service, periodName);
    }
    default:
      throw new Error("Service not implemented");
  }
  if(periods.length === 0) return;
  if(!defaultPeriod) defaultPeriod = getDefaultPeriod(periods);
  useEvaluationStore.getState().updatePeriods(periods, defaultPeriod);
}

export async function updateEvaluationsInCache <T extends Account> (account: T, periodName: string): Promise<void> {
  let evaluations: Evaluation[] = [];
  try {
    switch (account.service) {
      case AccountService.Pronote: {
        const { getEvaluations } = await import("./pronote/evaluations");
        evaluations = await getEvaluations(account, periodName);
        break;
      }
      case AccountService.PapillonMultiService: {
        const service = getFeatureAccount(MultiServiceFeature.Evaluations, account.localID);
        if (!service) {
          throw new Error("No service set in multi-service space");
        }
        return await updateEvaluationsInCache(service, periodName);
      }
      default:
        throw new Error(`Service (${AccountService[account.service]}) not implemented for this request`);
    }
    useEvaluationStore.getState().updateEvaluations(periodName, evaluations);
  }
  catch (err) {
    error(`not updated, see:${err}`, "updateGradesAndAveragesInCache");
  }
}
