import { NextFunction, Request, Response } from 'express';
import { OCPILocation, OCPILocationOptions } from '../../../../../types/ocpi/OCPILocation';

import AppError from '../../../../../exception/AppError';
import Constants from '../../../../../utils/Constants';
import { HTTPError } from '../../../../../types/HTTPError';
import OCPIClientFactory from '../../../../../client/ocpi/OCPIClientFactory';
import { OCPIConnector } from '../../../../../types/ocpi/OCPIConnector';
import { OCPIStatusCode } from '../../../../../types/ocpi/OCPIStatusCode';
import OCPIUtils from '../../../OCPIUtils';
import OCPIUtilsService from '../../OCPIUtilsService';
import { OcpiSetting } from '../../../../../types/Setting';
import { ServerAction } from '../../../../../types/Server';
import SiteStorage from '../../../../../storage/mongodb/SiteStorage';
import Tenant from '../../../../../types/Tenant';
import Utils from '../../../../../utils/Utils';

const MODULE_NAME = 'CPOLocationsService';

export default class CPOLocationsService {
  public static async handleGetLocations(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Split URL Segments
    //   /ocpi/cpo/2.0/locations/{location_id}
    //   /ocpi/cpo/2.0/locations/{location_id}/{evse_uid}
    //   /ocpi/cpo/2.0/locations/{location_id}/{evse_uid}/{connector_id}
    const { tenant, ocpiEndpoint } = req;
    // Remove action
    const urlSegment = req.path.substring(1).split('/');
    urlSegment.shift();
    // Get filters
    const locationId = urlSegment.shift();
    const evseUid = urlSegment.shift();
    const evseConnectorId = urlSegment.shift();
    let evseConnector = {};
    const ocpiClient = await OCPIClientFactory.getOcpiClient(tenant, ocpiEndpoint);
    // Define get option
    const options: OCPILocationOptions = {
      addChargeBoxAndOrgIDs: false,
      countryID: ocpiClient.getLocalCountryCode(action),
      partyID: ocpiClient.getLocalPartyID(action)
    };
    // Process request
    if (locationId && evseUid && evseConnectorId) {
      evseConnector = await CPOLocationsService.getConnector(tenant, locationId, evseUid, evseConnectorId, options, ocpiClient.getSettings());
      // Check if at least of site found
      if (!evseConnector) {
        throw new AppError({
          module: MODULE_NAME, method: 'handleGetLocations', action,
          errorCode: HTTPError.GENERAL_ERROR,
          message: `EVSE Connector ID '${evseConnectorId}' not found on Charging Station ID '${evseUid}' and Location ID '${locationId}'`,
          ocpiError: OCPIStatusCode.CODE_3000_GENERIC_SERVER_ERROR,
          detailedMessages: { locationId, evseUid, connectorId: evseConnectorId }
        });
      }
    } else if (locationId && evseUid) {
      evseConnector = await OCPIUtilsService.getCpoEvse(tenant, locationId, evseUid, options, ocpiClient.getSettings());
      // Check if at least of site found
      if (!evseConnector) {
        throw new AppError({
          module: MODULE_NAME, method: 'handleGetLocations', action,
          errorCode: HTTPError.GENERAL_ERROR,
          message: `EVSE UID not found '${evseUid}' in Location ID '${locationId}'`,
          ocpiError: OCPIStatusCode.CODE_3000_GENERIC_SERVER_ERROR,
          detailedMessages: { locationId, evseUid }
        });
      }
    } else if (locationId) {
      // Get single location
      evseConnector = await CPOLocationsService.getLocation(tenant, locationId, options, ocpiClient.getSettings());
      // Check if at least of site found
      if (!evseConnector) {
        throw new AppError({
          module: MODULE_NAME, method: 'handleGetLocations', action,
          errorCode: HTTPError.GENERAL_ERROR,
          message: `Location ID '${locationId}' not found`,
          ocpiError: OCPIStatusCode.CODE_3000_GENERIC_SERVER_ERROR,
          detailedMessages: { locationId }
        });
      }
    } else {
      // Get query parameters
      const offset = (req.query.offset) ? Utils.convertToInt(req.query.offset) : 0;
      const limit = (req.query.limit && Utils.convertToInt(req.query.limit) < Constants.OCPI_RECORDS_LIMIT) ? Utils.convertToInt(req.query.limit) : Constants.OCPI_RECORDS_LIMIT;
      // Get all locations
      const locations = await OCPIUtilsService.getAllCpoLocations(tenant, limit, offset, options, true, ocpiClient.getSettings());
      evseConnector = locations.result;
      // Set header
      res.set({
        'X-Total-Count': locations.count,
        'X-Limit': Constants.OCPI_RECORDS_LIMIT
      });
      // Return next link
      const nextUrl = OCPIUtils.buildNextUrl(req, OCPIUtilsService.getBaseUrl(req), offset, limit, locations.count);
      if (nextUrl) {
        res.links({
          next: nextUrl
        });
      }
    }
    res.json(OCPIUtils.success(evseConnector));
    next();
  }

  private static async getLocation(tenant: Tenant, locationId: string, options: OCPILocationOptions, settings: OcpiSetting): Promise<OCPILocation> {
    // Get site
    const site = await SiteStorage.getSite(tenant, locationId);
    if (site) {
      return OCPIUtilsService.convertSite2Location(tenant, site, options, true, settings);
    }
  }

  private static async getConnector(tenant: Tenant, locationId: string, evseUid: string, connectorId: string, options: OCPILocationOptions, settings: OcpiSetting): Promise<OCPIConnector> {
    // Get site
    const evse = await OCPIUtilsService.getCpoEvse(tenant, locationId, evseUid, options, settings);
    // Find the Connector
    return evse?.connectors.find((connector) => connector.id === connectorId);
  }
}
