import { type Account, AccountService } from "@/stores/account/types";
import { useNewsStore } from "@/stores/news";
import type { Information } from "./shared/Information";
import { checkIfSkoSupported } from "./skolengo/default-personalization";
import { error } from "@/utils/logger/logger";
import { newsRead } from "pawnote";
import { ca } from "date-fns/locale";
import {useMultiService} from "@/stores/multiService";
import {MultiServiceFeature} from "@/stores/multiService/types";

/**
 * Updates the state and cache for the news.
 */
export async function updateNewsInCache <T extends Account> (account: T): Promise<void> {
  switch (account.service) {
    case AccountService.Pronote: {
      const { getNews } = await import("./pronote/news");
      const informations = await getNews(account);
      useNewsStore.getState().updateInformations(informations);
      break;
    }
    case AccountService.Local: {
      useNewsStore.getState().updateInformations([]);
      break;
    }
    case AccountService.Skolengo: {
      if(!checkIfSkoSupported(account, "News")) {
        error("[updateNewsInCache]: This Skolengo instance doesn't support News.", "skolengo");
        break;
      }
      const { getNews } = await import("./skolengo/data/news");
      const informations = await getNews(account);
      useNewsStore.getState().updateInformations(informations);
      break;
    }
    case AccountService.EcoleDirecte: {
      const { getNews } = await import("./ecoledirecte/news");
      const informations = await getNews(account);
      useNewsStore.getState().updateInformations(informations);
      break;
    }
    case AccountService.Multi: {
      const { getNews } = await import("./multi/data/news");
      const informations = await getNews(account);
      useNewsStore.getState().updateInformations(informations);
      break;
    }
    case AccountService.PapillonMultiService: {
      const service = useMultiService().getFeatureAccount(MultiServiceFeature.News, account.localID);
      if (!service) {
        throw new Error("No service set in multi-service space");
      }
      return updateNewsInCache(service);
    }
    default: {
      throw new Error("Service not implemented.");
    }
  }
}

/**
 * Sets news read
 */
export async function setNewsRead <T extends Account> (account: T, message: Information, read: boolean = false): Promise<void> {
  switch (account.service) {
    case AccountService.Pronote: {
      if (!account.instance) {
        error("[setNewsRead]: Instance is undefined.", "pronote");
        break;
      }
      await newsRead(account.instance, message.ref, read);
      break;
    }
    case AccountService.Local: {
      break;
    }
    case AccountService.EcoleDirecte: {
      break;
    }
    case AccountService.Multi:
      break;
    case AccountService.PapillonMultiService: {
      const service = useMultiService().getFeatureAccount(MultiServiceFeature.News, account.localID);
      if (!service) {
        throw new Error("No service set in multi-service space");
      }
      return setNewsRead(service, message, read);
    }
    default: {
      throw new Error("Service not implemented.");
    }
  }
}
