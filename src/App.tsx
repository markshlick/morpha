import * as React from 'react';
import * as PropTypes from 'prop-types';
import {
  BrowserRouter as Router,
  Route,
  Link,
  RouteComponentProps,
} from 'react-router-dom';
import * as _ from 'lodash';

import './styles.css';

import { MorphaInjectedProps, MorphaProvider, morpha } from './morpha';

interface Obj<T> {
  [key: string]: T;
}

interface Item {
  id: string;
}

const items: Obj<Item> = _.keyBy(_.times(20, x => ({ id: `${x + 1}` })), 'id');

const data = { items };

const MorphaItem = morpha(
  ({ id, effectiveState }: MorphaInjectedProps & { id: string }) => (
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
        <h2>{id}</h2>
      </div>
    </div>
  ),
);

const Home = ({ items }: { items: Obj<Item> }) => (
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
          <MorphaItem name={`card.${id}`} state="small" id={id} />
        </Link>
      </div>
    ))}
  </div>
);

const Feature = ({ item: { id } }: { item: Item }) => (
  <div
    style={{
      height: '100%',
      padding: 20,
      maxWidth: '600px',
      margin: '0 auto',
      boxSizing: 'border-box',
    }}
  >
    <MorphaItem name={`card.${id}`} state="large" id={id} />
  </div>
);

const App: React.SFC<{}> = props => (
  <div className="App" style={{ height: '100%' }}>
    <MorphaProvider style={{ height: '100%' }}>
      <Route exact path="/" component={() => <Home items={data.items} />} />
      <Route
        path="/feature/:id"
        component={(routeProps: RouteComponentProps<{ id: string }>) => (
          <Feature item={data.items[routeProps.match.params.id]} />
        )}
      />
    </MorphaProvider>
  </div>
);

export default App;
