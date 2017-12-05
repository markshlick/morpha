import * as React from 'react';
import * as PropTypes from 'prop-types';

interface MorphaProps {
  style?: { [attr: string]: any };
  name: string;
  state: string;
  render: React.ComponentType;
}

interface TransitionProps {
  name: string;
  toState: string;
  fromState: string;
  fromRect: ClientRect;
  toRect: ClientRect;
  render: React.ComponentType;
}

interface TransitionConfigProps {
  name: string;
  state: string;
  render: React.ComponentType;
  rect?: ClientRect;
}

const MorphaContextPropTypes = {
  registerUnmount: PropTypes.func.isRequired,
  registerMount: PropTypes.func.isRequired,
  startTransition: PropTypes.func.isRequired,
  getTransitionRunningState: PropTypes.func.isRequired,
};

export class MorphaProvider extends React.Component<{
  style?: { [attr: string]: any };
}> {
  static childContextTypes = MorphaContextPropTypes;

  _container: HTMLDivElement | null;
  _transitionStore: { [name: string]: any };

  constructor(props: any) {
    super(props);
    this._transitionStore = {};
  }

  registerUnmount({ name, state, rect, render }: any) {
    if (this._transitionStore[name]) {
      this._transitionStore[name].fromState = state;
      this._transitionStore[name].toRect = rect;
      this._transitionStore[name].ready = true;
    }
  }

  registerMount({ name, state, render }: any) {
    this._transitionStore[name] = { name, render, toState: state };
  }

  async startTransition({ name, state, rect, render }: any) {
    const transition = this._transitionStore[name];
    if (transition) {
      transition.fromRect = rect;
      if (transition.ready) {
        transition.run = true;
        transition.progress = 0;
        this.forceUpdate(() => {
          this.runTransition(name);
        });
      }
    }
  }

  async runTransition(name: string) {
    const transition = this._transitionStore[name];
    transition.progress = Math.min(
      1,
      transition.progress + transition.progress / 8 + 0.02,
    );
    this.step(name);

    if (transition.progress < 1) {
      requestAnimationFrame(() => {
        this.runTransition(name);
      });
    } else {
      transition.run = false;
      this.forceUpdate();
    }
  }

  updatePositionProp(name: string, prop: string) {
    const transition = this._transitionStore[name];
    const val =
      transition.toRect[prop] +
      (transition.fromRect[prop] - transition.toRect[prop]) *
        transition.progress;

    transition.node.style[prop] = `${val}px`;
  }

  step(name: string) {
    this.updatePositionProp(name, 'top');
    this.updatePositionProp(name, 'left');
    this.updatePositionProp(name, 'height');
    this.updatePositionProp(name, 'width');
  }

  getTransitionRunningState({ name, state }: any) {
    if (!this._transitionStore[name]) {
      return false;
    }

    if (this._transitionStore[name].run) {
      return false;
    }

    return this._transitionStore[name].toState === state;
  }

  getChildContext() {
    return {
      registerUnmount: this.registerUnmount.bind(this),
      registerMount: this.registerMount.bind(this),
      startTransition: this.startTransition.bind(this),
      getTransitionRunningState: this.getTransitionRunningState.bind(this),
    };
  }

  renderTransitioningComponents() {
    return Object.values(this._transitionStore)
      .filter(({ run }) => run)
      .map(({ name, render, toRect, fromRect }: TransitionProps) => {
        const MorphaComponent = render;

        return (
          <div
            key={name}
            ref={node => (this._transitionStore[name].node = node)}
            style={{
              position: 'fixed',
              transform: 'translate3d(0, 0, 0)',
              top: toRect.top,
              left: toRect.left,
              width: toRect.width,
              height: toRect.height,
            }}
          >
            <MorphaComponent />
          </div>
        );
      });
  }

  render() {
    return (
      <div
        style={this.props.style}
        ref={_container => (this._container = _container)}
      >
        {this.props.children}
        {this.renderTransitioningComponents()}
      </div>
    );
  }
}

export class MorphaContainer extends React.Component<MorphaProps> {
  static contextTypes = MorphaContextPropTypes;

  _container: HTMLDivElement | null;

  render() {
    const MorphaComponent = this.props.render;
    return (
      <div
        style={{ height: '100%', width: '100%', ...this.props.style }}
        ref={_container => (this._container = _container)}
      >
        {this.context.getTransitionRunningState({
          name: this.props.name,
          state: this.props.state,
        }) && <MorphaComponent />}
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
      render: this.props.render,
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

export const morphStyles = (styles: object) => (
  x: React.ComponentType<{ [key: string]: any }>,
) => x;
