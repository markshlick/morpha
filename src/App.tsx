import * as React from 'react';
import * as PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import {
  MorphaInjectedProps,
  MorphaProvider,
  MorphaContainer,
  morphStyles,
} from './morpha';

interface Item {
  id: string;
}

const data = {
  items: {
    1: {
      id: '1',
    },
    2: {
      id: '2',
    },
    3: {
      id: '3',
    },
    4: {
      id: '4',
    },
    5: {
      id: '5',
    },
    6: {
      id: '6',
    },
  },
};

const FeatureItem = ({
  id,
  effectiveState,
}: MorphaInjectedProps & { id: string }) => (
  <div
    style={{
      backgroundColor: '#ddd',
      height: '100%',
      boxSizing: 'border-box',
      borderRadius: 3,
    }}
  >
    <div
      style={{
        transition: 'all 300ms',
        backgroundColor: '#444',
        height: effectiveState === 'small' ? '30%' : '50%',
      }}
    />
    <div
      key="foo"
      style={{
        padding: '10px 20px',
        boxSizing: 'border-box',
        transition: 'all 300ms',
        color: 'white',
        fontSize: effectiveState === 'small' ? 14 : 28,
        backgroundColor: effectiveState === 'small' ? '#6ab7ff' : '#1e88e5',
      }}
    >
      <h2 style={{}}>{id}</h2>
    </div>
  </div>
);

const MorphItem = morphStyles({})(FeatureItem);

const Home = ({ items }: { items: { [id: string]: Item } }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
    }}
  >
    {Object.values(items).map(({ id }) => (
      <div
        key={id}
        style={{
          width: 240,
          height: 300,
          padding: 20,
          boxSizing: 'border-box',
          float: 'left',
        }}
      >
        <Link
          to={`/feature/${id}`}
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          <MorphaContainer
            name={`card.${id}`}
            state="small"
            render={props => <MorphItem {...props} id={id} />}
          />
        </Link>
      </div>
    ))}
  </div>
);

const Feature = ({ item: { id } }: { item: { id: string } }) => (
  <div
    style={{
      height: '100%',
      padding: 20,
      maxWidth: '600px',
      margin: '0 auto',
      boxSizing: 'border-box',
    }}
  >
    <MorphaContainer
      name={`card.${id}`}
      state="large"
      render={props => <MorphItem {...props} id={id} />}
    />
  </div>
);

const App: React.SFC<{}> = props => (
  <div className="App" style={{ height: '100%' }}>
    <MorphaProvider style={{ height: '100%' }}>
      <Route exact path="/" component={() => <Home items={data.items} />} />
      <Route
        path="/feature/:id"
        component={({
          match: { params: { id } },
        }: {
          match: { params: { id: string } };
        }) => <Feature item={data.items[id]} />}
      />
    </MorphaProvider>
  </div>
);

export default App;
