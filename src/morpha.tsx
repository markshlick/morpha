import * as React from 'react';
import * as PropTypes from 'prop-types';

/*
  TODO:
  - transition definitions to prevent copy/pasting the same config across
    multiple MorphaContainers
  - cache the element returned from MorphaProps.render to prevent unnecessary
    (un)mounts
  - easings
  - expose a prop flag that will call MorphaProps.render with every transition
    tick (for vdom-driven libs like react-motion)
  - integrate with react-anime/CSSTransitionGroup
  - interruptability/reversability
*/

export interface MorphaInjectedProps {
  isMorphing?: boolean;
  fromState?: string;
  toState?: string;
  idleState?: string;
  effectiveState?: string;
}

interface MorphaProps {
  style?: React.CSSProperties;
  name: string;
  state: string;
  render: React.ComponentType<MorphaInjectedProps>;
}

interface TransitionProps {
  name: string;
  toState: string;
  fromState: string;
  toRect: ClientRect;
  fromRect: ClientRect;
  render: React.ComponentType<MorphaInjectedProps>;
  firstRun: boolean;
}

interface TransitionConfigProps {
  name: string;
  state: string;
  render: React.ComponentType<MorphaInjectedProps>;
  rect?: ClientRect;
}

interface ClientRectPOJO {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

interface ReactStateStyles {
  [key: string]: React.CSSProperties;
}

const MorphaProviderContextPropTypes = {
  registerUnmount: PropTypes.func.isRequired,
  registerMount: PropTypes.func.isRequired,
  startTransition: PropTypes.func.isRequired,
  shouldRender: PropTypes.func.isRequired,
};

const MorphaContainerContextPropTypes = {
  registerSubTransition: PropTypes.func.isRequired,
  deregisterSubTransition: PropTypes.func.isRequired,
};

const clientRectToPOJO = (rect: ClientRect) => ({
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
  left: rect.left,
  width: rect.width,
  height: rect.height,
});

class MorphaTransition {
  name: string;
  render: React.ComponentType;
  idleState: string;
  fromState: string;
  toState: string;
  toRect: ClientRectPOJO;
  fromRect: ClientRectPOJO;
  movingRect: ClientRectPOJO;
  progress: number;
  topOffset: number;
  running: boolean;
  firstRun: boolean;
  node: HTMLElement | null;

  constructor({ name, fromState }: { name: string; fromState: string }) {
    this.name = name;
    this.idleState = fromState;
    this.fromState = fromState;
    this.progress = 0;
  }

  isReady() {
    return (
      this.render &&
      this.fromState &&
      this.toState &&
      this.fromRect &&
      this.toRect
    );
  }

  prepareRun() {
    const topOffset =
      window.pageYOffset || document.documentElement.scrollTop || 0;
    const leftOffset =
      window.pageXOffset || document.documentElement.scrollLeft || 0;
    this.running = true;
    this.progress = 0;
    this.movingRect = { ...this.fromRect };
    this.movingRect.top -= topOffset;
    this.movingRect.left -= leftOffset;
  }

  run(done: () => void) {
    this.progress = Math.min(1, this.progress + this.progress / 6 + 0.02);

    this.step();

    if (this.progress < 1) {
      requestAnimationFrame(() => {
        this.run(done);
      });
    } else {
      this.fromState = this.toState;
      this.fromRect = this.toRect;
      this.reset();
      done();
    }
  }

  step() {
    this.updatePositionProp(name, 'top');
    this.updatePositionProp(name, 'left');
    this.updatePositionProp(name, 'height');
    this.updatePositionProp(name, 'width');
  }

  updatePositionProp(name: string, prop: string, mod: number = 0) {
    const val =
      mod +
      this.movingRect[prop] +
      (this.toRect[prop] - this.movingRect[prop]) * this.progress;

    if (this.node) {
      this.node.style[prop] = `${val}px`;
    }
  }

  reset() {
    this.running = false;
    this.progress = 0;
    delete this.toRect;
    delete this.toState;
    delete this.movingRect;
    delete this.topOffset;
  }
}

export class MorphaProvider extends React.Component<{
  style?: React.CSSProperties;
}> {
  static childContextTypes = MorphaProviderContextPropTypes;

  private container: HTMLDivElement | null;
  private transitionStore: { [name: string]: MorphaTransition };

  constructor(props: any) {
    super(props);
    this.transitionStore = {};
  }

  getChildContext() {
    return {
      registerUnmount: this.registerUnmount.bind(this),
      registerMount: this.registerMount.bind(this),
      startTransition: this.startTransition.bind(this),
      shouldRender: this.shouldRender.bind(this),
    };
  }

  registerUnmount({
    name,
    state,
    rect,
  }: {
    name: string;
    state: string;
    rect: ClientRectPOJO;
  }) {
    const transition = this.transitionStore[name];
    if (transition && transition.fromState === state) {
      transition.fromRect = rect;
    }
  }

  registerMount({
    name,
    state,
    render,
  }: {
    name: string;
    state: string;
    render: React.ComponentType;
  }) {
    const transition = this.transitionStore[name];
    if (transition && transition.fromState !== state) {
      transition.toState = state;
      transition.render = render;
    } else {
      this.transitionStore[name] = new MorphaTransition({
        name,
        fromState: state,
      });
    }
  }

  startTransition({
    name,
    state,
    rect,
  }: {
    name: string;
    state: string;
    rect: ClientRectPOJO;
  }) {
    return new Promise(done => {
      const transition = this.transitionStore[name];
      if (transition && transition.fromState !== state) {
        transition.toRect = rect;
        if (transition.isReady()) {
          transition.prepareRun();
          transition.firstRun = true;
          this.forceUpdate(() => {
            transition.firstRun = false;
            setTimeout(() => {
              this.forceUpdate(() => {
                setTimeout(() => {
                  transition.run(() => {
                    this.forceUpdate(done);
                  });
                });
              });
            });
          });
        }
      }
    });
  }

  shouldRender({ name, state }: { name: string; state: string }) {
    if (!this.transitionStore[name]) {
      return false;
    }

    if (this.transitionStore[name].running) {
      return false;
    }

    return this.transitionStore[name].fromState === state;
  }

  renderTransitioningComponents() {
    return Object.values(this.transitionStore)
      .filter(({ running }) => running)
      .map(
        ({
          name,
          render,
          fromRect,
          fromState,
          toState,
          firstRun,
        }: TransitionProps) => {
          const MorphaComponent = render;

          return (
            <div
              key={name}
              ref={node => (this.transitionStore[name].node = node)}
              style={{
                position: 'fixed',
                transform: 'translate3d(0, 0, 0)',
                top: fromRect.top,
                left: fromRect.left,
                width: fromRect.width,
                height: fromRect.height,
              }}
            >
              <MorphaComponent
                fromState={fromState}
                toState={toState}
                isMorphing={true}
                effectiveState={firstRun ? fromState : toState}
              />
            </div>
          );
        },
      );
  }

  render() {
    return (
      <div
        style={this.props.style}
        ref={_container => (this.container = _container)}
      >
        {this.props.children}
        {this.renderTransitioningComponents()}
      </div>
    );
  }
}

export class MorphaContainer extends React.Component<MorphaProps> {
  static contextTypes = MorphaProviderContextPropTypes;

  static childContextTypes = MorphaContainerContextPropTypes;

  _container: HTMLDivElement | null;

  render() {
    const MorphaComponent = this.props.render;
    return (
      <div
        style={{ height: '100%', width: '100%', ...this.props.style }}
        ref={_container => (this._container = _container)}
      >
        {this.context.shouldRender({
          name: this.props.name,
          state: this.props.state,
        }) && <MorphaComponent effectiveState={this.props.state} />}
      </div>
    );
  }

  getChildContext() {
    return {
      registerSubTransition: this.registerSubTransition.bind(this),
      deregisterSubTransition: this.deregisterSubTransition.bind(this),
    };
  }

  componentWillUnmount() {
    let rect;
    if (this._container) {
      rect = clientRectToPOJO(this._container.getBoundingClientRect());
    }

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
    let rect;
    if (this._container) {
      rect = clientRectToPOJO(this._container.getBoundingClientRect());
    }

    this.context.startTransition({
      rect,
      state: this.props.state,
      name: this.props.name,
    });
  }

  registerSubTransition(el: React.ComponentType, styles: ReactStateStyles) {}
  deregisterSubTransition() {}
}

/*
export class ScrollContainer extends React.Component {
  render() {
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            overflow: 'scroll',
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
          }}
        >
          {this.props.children}
        </div>
      </div>
    );
  }
}
*/

/*
interface MorphaContentProps {
  name: string;
  render: React.ComponentType;
}

export class MorphaContent {
  name: string;
  render: React.ComponentType;
  constructor({ render, name }: MorphaContentProps) {
    this.name = name;
    this.render = render;
  }
}
*/

/*
export const morphStyles = (styles: ReactStateStyles) => <
  TOriginalProps extends {}
>(
  BaseComponent: React.ComponentType<TOriginalProps>,
) => {
  return class extends React.Component<TOriginalProps> {
    // static contextTypes = MorphaContainerContextPropTypes;
    componentDidMount() {
      // this.context.registerSubTransition(this, styles);
    }

    componentWillUnmount() {
      // this.context.deregisterSubTransition();
    }

    render() {
      return <BaseComponent {...this.props} />;
    }
  };
};
*/
