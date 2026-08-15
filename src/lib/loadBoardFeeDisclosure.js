/** Load board transaction fee shown at signup and broker onboarding. */
export const LOAD_BOARD_TRANSACTION_FEE_PERCENT = 3.5;

export const LOAD_BOARD_FEE_DISCLOSURE = {
  title: 'Load Board platform fee',
  summary: `Using the FleetCo Load Board includes a ${LOAD_BOARD_TRANSACTION_FEE_PERCENT}% platform fee on total load value when freight is booked and completed through the marketplace.`,
  cardOnFile:
    'A valid credit card must remain on file with FleetCo. We may charge that card automatically to collect load board transaction fees when loads complete.',
  checkboxLabel: `I understand and agree to the ${LOAD_BOARD_TRANSACTION_FEE_PERCENT}% load board platform fee and authorize FleetCo to keep a credit card on file for fee collection.`,
};
