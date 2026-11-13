import './v2.css';
import { CreatorBuilds } from './CreatorBuilds';
import { DoorsV2 } from './DoorsV2';
import { Explainers } from './Explainers';
import { FindSeller } from './FindSeller';
import { GameCheck } from './GameCheck';
import { HeroV2 } from './HeroV2';
import { PhoneActionBar } from './PhoneActionBar';
import { PresenceBand } from './PresenceBand';

/** NEW_HOME_V2 · mounted before the locked homepage sections: story first, then one easy step. */
export function HomeV2Lead() {
  return (
    <div className="v2" data-layer="home-v2">
      <HeroV2 />
      <PresenceBand />
      <DoorsV2 />
      <GameCheck />
      <Explainers />
      <CreatorBuilds />
    </div>
  );
}

/** NEW_HOME_V2 · mounted after the locked homepage sections: the quiet seller list + phone bar. */
export function HomeV2Tail() {
  return (
    <div className="v2" data-layer="home-v2">
      <FindSeller />
      <PhoneActionBar />
    </div>
  );
}
