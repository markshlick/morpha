import * as React from 'react';
import * as PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import { MorphaProvider, MorphaContainer, morphStyles } from './morpha';

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

const MorphItem = morphStyles({})(({ id }) => (
  <div
    style={{
      backgroundColor: '#ddd',
      padding: 20,
      height: '100%',
      boxSizing: 'border-box',
      borderRadius: 3,
    }}
  >
    <h2>{id}</h2>
  </div>
));

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
            render={() => <MorphItem id={id} />}
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
      render={() => <MorphItem id={id} />}
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
