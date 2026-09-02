import React from 'react';
import type { SubMode } from '../../types';
import { ReligionView } from './views/ReligionView';
import { PopulationView } from './views/PopulationView';
import { DemographicsView } from './views/DemographicsView';
import { EconomyView } from './views/EconomyView';
import { PoliticsView } from './views/PoliticsView';
import { MilitaryView } from './views/MilitaryView';
import { ClimateView } from './views/ClimateView';
import { GeographyView } from './views/GeographyView';
import { ResourcesView } from './views/ResourcesView';

interface SheetContentRouterProps {
  subMode: SubMode;
  dataVersion: number;
  countryProps: any;
  continentStats: any;
  isCountry: boolean;
}

export const SheetContentRouter: React.FC<SheetContentRouterProps> = React.memo(({
  subMode,
  dataVersion,
  countryProps,
  continentStats,
  isCountry,
}) => {
  const commonProps = { countryProps, continentStats, isCountry };
  const key = `${subMode}_${dataVersion}`;

  switch (subMode) {
    case 'religion':
      return <ReligionView key={key} {...commonProps} />;
    case 'population':
      return <PopulationView key={key} {...commonProps} />;
    case 'demographics':
      return <DemographicsView key={key} {...commonProps} />;
    case 'economy':
      return <EconomyView key={key} {...commonProps} />;
    case 'politics':
      return <PoliticsView key={key} {...commonProps} />;
    case 'military':
      return <MilitaryView key={key} {...commonProps} />;
    case 'climate':
      return <ClimateView key={key} {...commonProps} />;
    case 'geography':
      return <GeographyView key={key} {...commonProps} />;
    case 'resources':
      return <ResourcesView key={key} {...commonProps} />;
    default:
      return <ReligionView key={key} {...commonProps} />;
  }
});
