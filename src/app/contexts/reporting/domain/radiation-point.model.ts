import { RadiationLevel } from '../../monitoring/domain/radiation-level';

/** Un punto del mapa: una lectura geolocalizada. */
export interface RadiationPoint {
  id: number;
  latitude: number;
  longitude: number;
  location: string;
  sensorId: string;
  value: number;
  level: RadiationLevel;
  readingDate: string;
}

/** Última lectura de un sensor dentro de la sede de un cliente. */
export interface ClientDeviceReading {
  deviceId: number;
  deviceName: string;
  deviceType: string;
  serialNumber: string;
  deviceLocation: string;
  deviceStatus: string;
  latestValue: number;
  level: RadiationLevel;
  readingDate: string;
}

/**
 * Un marcador por cliente, en la sede que tiene registrada, con el desglose de sus
 * sensores. El titular es el peor sensor **ahora mismo**, no el pico histórico.
 */
export interface ClientRadiationPoint {
  clientId: number;
  clientName: string;
  latitude: number;
  longitude: number;
  location: string;
  maxValue: number;
  level: RadiationLevel;
  devices: ClientDeviceReading[];
}
