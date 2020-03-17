export const Panel = ({ children, className = '', name }) => (
  <div class={`${className} panel`} data-panel={name} hidden>
    {children}
  </div>
);

export const PanelSlider = ({ children }) => (
  <div class="panel-slider-container">
    <div class="panel-slider">{children}</div>
  </div>
);
