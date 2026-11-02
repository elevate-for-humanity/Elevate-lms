/** Educational models: steady-state assumptions, never live equipment instructions. */
export const refrigerationStages = [
  { name: 'Compressor', state: 'High-pressure superheated vapor', action: 'Adds work to raise vapor pressure and temperature. It does not turn refrigerant directly into liquid.', question: 'What normally leaves the compressor?', choices: ['High-pressure vapor', 'Low-pressure liquid', 'Air'], answer: 0 },
  { name: 'Condenser', state: 'High-pressure liquid at outlet', action: 'Rejects heat to the surroundings. Vapor condenses; liquid may then subcool. Heat rejected includes evaporator heat plus compressor work.', question: 'Where does heat leave the refrigerant?', choices: ['Metering device', 'Condenser', 'Compressor inlet'], answer: 1 },
  { name: 'Metering device', state: 'Low-pressure liquid/vapor mixture', action: 'Restricts flow and lowers pressure. Some liquid flashes to vapor. The evaporator receives a mixture, not simply all-liquid refrigerant.', question: 'What happens across the metering device?', choices: ['Pressure rises', 'All vapor becomes liquid', 'Pressure falls'], answer: 2 },
  { name: 'Evaporator', state: 'Low-pressure vapor at outlet', action: 'Absorbs heat from the space or load as liquid boils. Vapor may superheat before returning to the compressor.', question: 'What changes if airflow falls in this simplified cooling example?', choices: ['Heat transfer may fall; investigate airflow', 'Refrigerant must always be added', 'EPA certification is earned'], answer: 0 },
] as const;

export function superheat(suctionTemperature: number, saturationTemperature: number) {
  return suctionTemperature - saturationTemperature;
}
export function subcooling(saturationTemperature: number, liquidTemperature: number) {
  return saturationTemperature - liquidTemperature;
}
