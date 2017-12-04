import * as React from 'react';
import * as PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

interface MorphaProps {
  style?: { [attr: string]: any };
  name: string;
  state: string;
  render: React.ComponentType;
}

interface MorphaContext {
  registerUnmount: (node: React.ReactNode) => void;
  registerMount: (node: React.ReactNode) => void;
  startTransition: (node: React.ReactNode) => void;
}

const MorphaContextPropTypes = {
  registerUnmount: PropTypes.func.isRequired,
  registerMount: PropTypes.func.isRequired,
  startTransition: PropTypes.func.isRequired,
};

class MorphaProvider extends React.Component<{
  style?: { [attr: string]: any };
}> {
  static childContextTypes = MorphaContextPropTypes;

  _container: HTMLDivElement | null;
  _transitionStore: object | null;

  constructor(props: any) {
    super(props);
    this._transitionStore = {};
  }

  registerUnmount(params: any) {
    console.log(params);
  }

  registerMount(params: any) {
    console.log(params);
  }

  startTransition(params: any) {
    console.log(params);
  }

  getChildContext() {
    return {
      registerUnmount: this.registerUnmount.bind(this),
      registerMount: this.registerMount.bind(this),
      startTransition: this.startTransition.bind(this),
    };
  }

  render() {
    return (
      <div
        style={this.props.style}
        ref={_container => (this._container = _container)}
      >
        {this.props.children}
      </div>
    );
  }
}

class MorphaContainer extends React.Component<MorphaProps> {
  static contextTypes = MorphaContextPropTypes;

  _container: HTMLDivElement | null;

  render() {
    const MorphaComponent = this.props.render;
    return (
      <div
        style={this.props.style}
        ref={_container => (this._container = _container)}
      >
        <MorphaComponent />
      </div>
    );
  }

  componentWillUnmount() {
    const rect = this._container
      ? this._container.getBoundingClientRect()
      : null;

    this.context.registerUnmount({
      rect,
      name: this.props.name,
      state: this.props.state,
    });
  }

  componentWillMount() {
    this.context.registerMount({
      name: this.props.name,
      state: this.props.state,
    });
  }

  componentDidMount() {
    const rect = this._container
      ? this._container.getBoundingClientRect()
      : null;
    this.context.startTransition({
      rect,
      name: this.props.name,
    });
  }
}

const morphStyles = (styles: object) => (
  x: React.ComponentType<{ [key: string]: any }>,
) => x;

interface Item {
  id: string;
}

const data = {
  items: {
    1: {
      id: '1',
    },
  },
};

const MorphItem = morphStyles({})(({ id }) => (
  <div
    style={{
      backgroundColor: '#eee',
      padding: 10,
      height: '100%',
      boxSizing: 'border-box',
    }}
  >
    <h2>{id}</h2>
  </div>
));

const Home = ({ items }: { items: { [id: string]: Item } }) => (
  <div>
    {Object.values(items).map(({ id }) => (
      <div
        style={{
          height: 400,
          width: 250,
          padding: 20,
          boxSizing: 'border-box',
        }}
      >
        <Link key={id} to={`/feature/${id}`}>
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
      style={{ height: '100%' }}
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
