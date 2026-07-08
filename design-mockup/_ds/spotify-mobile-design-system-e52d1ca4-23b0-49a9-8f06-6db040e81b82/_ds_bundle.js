/* @ds-bundle: {"format":4,"namespace":"SpotifyMobileDesignSystem_e52d1c","components":[{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"IconButton","sourcePath":"components/controls/IconButton.jsx"},{"name":"PillButton","sourcePath":"components/controls/PillButton.jsx"},{"name":"PlayButton","sourcePath":"components/controls/PlayButton.jsx"},{"name":"ProgressBar","sourcePath":"components/controls/ProgressBar.jsx"},{"name":"Equalizer","sourcePath":"components/feedback/Equalizer.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"SearchField","sourcePath":"components/inputs/SearchField.jsx"},{"name":"ArrowNarrowDown1","sourcePath":"components/kit/ArrowNarrowDown1.jsx"},{"name":"ButtonM","sourcePath":"components/kit/ButtonM.jsx"},{"name":"Component17","sourcePath":"components/kit/Component17.jsx"},{"name":"Component18","sourcePath":"components/kit/Component18.jsx"},{"name":"Component19","sourcePath":"components/kit/Component19.jsx"},{"name":"Component20","sourcePath":"components/kit/Component20.jsx"},{"name":"Component27","sourcePath":"components/kit/Component27.jsx"},{"name":"Component28","sourcePath":"components/kit/Component28.jsx"},{"name":"Component29","sourcePath":"components/kit/Component29.jsx"},{"name":"Component30","sourcePath":"components/kit/Component30.jsx"},{"name":"Component31","sourcePath":"components/kit/Component31.jsx"},{"name":"Component32","sourcePath":"components/kit/Component32.jsx"},{"name":"Component33","sourcePath":"components/kit/Component33.jsx"},{"name":"Component34","sourcePath":"components/kit/Component34.jsx"},{"name":"Component35","sourcePath":"components/kit/Component35.jsx"},{"name":"Component36","sourcePath":"components/kit/Component36.jsx"},{"name":"Component37","sourcePath":"components/kit/Component37.jsx"},{"name":"Component9","sourcePath":"components/kit/Component9.jsx"},{"name":"CoverDisc","sourcePath":"components/kit/CoverDisc.jsx"},{"name":"LibrarySmall","sourcePath":"components/kit/LibrarySmall.jsx"},{"name":"ListeningOn","sourcePath":"components/kit/ListeningOn.jsx"},{"name":"SearchLink","sourcePath":"components/kit/SearchLink.jsx"},{"name":"Share","sourcePath":"components/kit/Share.jsx"},{"name":"CoverArt","sourcePath":"components/media/CoverArt.jsx"},{"name":"GenreCard","sourcePath":"components/media/GenreCard.jsx"},{"name":"NowPlayingBar","sourcePath":"components/media/NowPlayingBar.jsx"},{"name":"SectionHeader","sourcePath":"components/media/SectionHeader.jsx"},{"name":"TrackRow","sourcePath":"components/media/TrackRow.jsx"},{"name":"FilterChip","sourcePath":"components/navigation/FilterChip.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"StatusBar","sourcePath":"components/system/StatusBar.jsx"}],"sourceHashes":{"components/brand/Logo.jsx":"ffec9da3556c","components/controls/IconButton.jsx":"d1bee2bdacd0","components/controls/PillButton.jsx":"d87e0485f871","components/controls/PlayButton.jsx":"d94aa2f141e4","components/controls/ProgressBar.jsx":"31c9a5acb08d","components/feedback/Equalizer.jsx":"6cdfc48d3678","components/icons/Icon.jsx":"b81dfc2559d3","components/icons/icon-data.js":"6bfbe3056f6b","components/inputs/SearchField.jsx":"6816ecc3face","components/kit/ArrowNarrowDown1.jsx":"ab02ac66244a","components/kit/ButtonM.jsx":"5859f6c1894a","components/kit/Component17.jsx":"b01c12c80dc2","components/kit/Component18.jsx":"bd590c74f78c","components/kit/Component19.jsx":"3002706757e1","components/kit/Component20.jsx":"72a7a726747f","components/kit/Component27.jsx":"779bbb95819c","components/kit/Component28.jsx":"d07631e13467","components/kit/Component29.jsx":"90becc54750d","components/kit/Component30.jsx":"a6c96800669b","components/kit/Component31.jsx":"e55093bcffb7","components/kit/Component32.jsx":"26261c47294b","components/kit/Component33.jsx":"0ebcaa98f0dd","components/kit/Component34.jsx":"3184a5314f2e","components/kit/Component35.jsx":"4872108075da","components/kit/Component36.jsx":"daec4c55a799","components/kit/Component37.jsx":"3b64f955362c","components/kit/Component9.jsx":"075d24141fe0","components/kit/CoverDisc.jsx":"73520d609512","components/kit/LibrarySmall.jsx":"98187b1dcb97","components/kit/ListeningOn.jsx":"b2880361b18b","components/kit/SearchLink.jsx":"2aac3a73bb1f","components/kit/Share.jsx":"20d4521f8576","components/media/CoverArt.jsx":"2ae6a2a331d9","components/media/GenreCard.jsx":"fe5d8f937cfe","components/media/NowPlayingBar.jsx":"5115cf07597c","components/media/SectionHeader.jsx":"235b23136707","components/media/TrackRow.jsx":"a17aabed0a4c","components/navigation/FilterChip.jsx":"230b39ea913b","components/navigation/TabBar.jsx":"74b81a77f9e1","components/system/StatusBar.jsx":"18f0678cdcb1","ui_kits/spotify-mobile/screens.jsx":"ea38f9c94bcc"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SpotifyMobileDesignSystem_e52d1c = window.SpotifyMobileDesignSystem_e52d1c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Logo — the Spotify wordmark/glyph. Renders the brand mark copied verbatim
 * from the source Figma file (assets/spotify-logo.svg), painted with
 * currentColor. Default green; pass `color` for white/black lockups.
 * Optional `wordmark` renders the name beside the glyph.
 */
function Logo({
  size = 36,
  color = 'var(--green-logo, #57B65F)',
  wordmark = false,
  style,
  ...rest
}) {
  const mark = /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 36.853 36.852",
    fill: "none",
    style: {
      display: 'block',
      color
    },
    "aria-label": "Spotify"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 18.426 0 C 8.25 0 0 8.25 0 18.426 C 0 28.603 8.25 36.852 18.426 36.852 C 28.604 36.852 36.853 28.603 36.853 18.426 C 36.853 8.25 28.604 0 18.426 0 Z M 26.877 26.576 C 26.547 27.117 25.838 27.289 25.297 26.957 C 20.971 24.314 15.524 23.715 9.11 25.181 C 8.492 25.322 7.876 24.934 7.735 24.316 C 7.594 23.698 7.979 23.082 8.599 22.941 C 15.618 21.337 21.639 22.028 26.496 24.996 C 27.037 25.328 27.209 26.035 26.877 26.576 Z M 29.132 21.559 C 28.716 22.235 27.832 22.448 27.156 22.032 C 22.203 18.988 14.653 18.106 8.795 19.884 C 8.035 20.114 7.232 19.686 7.002 18.927 C 6.773 18.167 7.201 17.367 7.96 17.136 C 14.652 15.105 22.971 16.089 28.659 19.584 C 29.335 20 29.548 20.884 29.132 21.559 Z M 29.326 16.334 C 23.387 12.807 13.589 12.482 7.919 14.203 C 7.008 14.479 6.045 13.965 5.769 13.055 C 5.493 12.144 6.007 11.182 6.918 10.905 C 13.427 8.929 24.247 9.311 31.085 13.37 C 31.905 13.856 32.174 14.914 31.688 15.731 C 31.203 16.55 30.142 16.82 29.326 16.334 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  }));
  if (!wordmark) return React.cloneElement(mark, {
    style: {
      ...mark.props.style,
      ...style
    },
    ...rest
  });
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.28,
      color,
      ...style
    }
  }, rest), mark, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: size * 0.72,
      letterSpacing: '-0.02em'
    }
  }, "Spotify"));
}
Object.assign(__ds_scope, { Logo, __ds_default_components_brand_Logo_1q8yv4x: Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/controls/PillButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PillButton — fully-rounded button. Spotify uses two flavours:
 *  - `variant="primary"` : solid green CTA ("Log in", big actions)
 *  - `variant="outline"` : transparent w/ hairline border ("Follow", "Edit Profile")
 */
function PillButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '7px 18px',
      fontSize: 12
    },
    md: {
      padding: '11px 32px',
      fontSize: 14
    },
    lg: {
      padding: '15px 44px',
      fontSize: 16
    }
  }[size];
  const variants = {
    primary: {
      background: 'var(--green-bright, #1ED760)',
      color: 'var(--text-black, #191414)',
      border: 'none'
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-white, #fff)',
      border: '1px solid rgba(255,255,255,0.5)'
    },
    filledDark: {
      background: 'var(--surface-4, #3E3F3F)',
      color: 'var(--text-white, #fff)',
      border: 'none'
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    disabled: disabled,
    style: {
      ...sizes,
      ...variants,
      borderRadius: 'var(--radius-pill, 999px)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      letterSpacing: '0.02em',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'transform .1s ease, filter .1s ease',
      whiteSpace: 'nowrap',
      ...style
    },
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.filter = 'brightness(1.08)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.filter = 'none';
      e.currentTarget.style.transform = 'scale(1)';
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'scale(1.04)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'scale(1)';
    }
  }, rest), children);
}
Object.assign(__ds_scope, { PillButton, __ds_default_components_controls_PillButton_1o24c22: PillButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/controls/PillButton.jsx", error: String((e && e.message) || e) }); }

// components/controls/PlayButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PlayButton — Spotify's signature circular green play / pause button.
 * Green #1DB954 fill with a black glyph, used on album & track views.
 */
function PlayButton({
  playing = false,
  size = 56,
  onClick,
  style,
  ...rest
}) {
  const glyph = size * 0.4;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    "aria-label": playing ? 'Pause' : 'Play',
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      border: 'none',
      background: 'var(--green-core, #1DB954)',
      color: 'var(--text-black, #191414)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      transition: 'transform .1s ease, filter .1s ease',
      ...style
    },
    onMouseDown: e => e.currentTarget.style.transform = 'scale(0.94)',
    onMouseUp: e => e.currentTarget.style.transform = 'scale(1)',
    onMouseLeave: e => e.currentTarget.style.transform = 'scale(1)'
  }, rest), playing ? /*#__PURE__*/React.createElement("svg", {
    width: glyph,
    height: glyph,
    viewBox: "0 0 12 14",
    fill: "currentColor",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "0",
    width: "3.4",
    height: "14",
    rx: "0.4"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "8.6",
    y: "0",
    width: "3.4",
    height: "14",
    rx: "0.4"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: glyph,
    height: glyph,
    viewBox: "0 0 12 14",
    fill: "currentColor",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 0.5 L12 7 L0 13.5 Z"
  })));
}
Object.assign(__ds_scope, { PlayButton, __ds_default_components_controls_PlayButton_1wr4x0v: PlayButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/controls/PlayButton.jsx", error: String((e && e.message) || e) }); }

// components/controls/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ProgressBar — the thin track scrubber used in the now-playing and
 * mini-player views. 2–4px tall rounded rail; filled portion in white or
 * green with an optional draggable knob.
 */
function ProgressBar({
  value = 0.35,
  height = 4,
  color = 'var(--text-white, #fff)',
  trackColor = 'rgba(255,255,255,0.3)',
  knob = false,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: '100%',
      height,
      borderRadius: 4,
      background: trackColor,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: `${pct}%`,
      borderRadius: 4,
      background: color
    }
  }), knob && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: `${pct}%`,
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: height + 8,
      height: height + 8,
      borderRadius: '50%',
      background: '#fff'
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar, __ds_default_components_controls_ProgressBar_5uybvr: ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/controls/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Equalizer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Equalizer — the animated 3-bar "playing right now" indicator (the kit's
 * "Component 9" / "Playing right now"). Bars pulse in green; pass
 * `animated={false}` for the static (paused) state.
 */
function Equalizer({
  size = 18,
  color = 'var(--green-bright, #1ED760)',
  animated = true,
  style,
  ...rest
}) {
  const barW = size * 0.18;
  const gap = size * 0.14;
  const bars = [0.55, 1, 0.4];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'flex-end',
      gap,
      height: size,
      ...style
    },
    "aria-label": "Now playing"
  }, rest), /*#__PURE__*/React.createElement("style", null, `
        @keyframes sp-eq-1 { 0%,100%{transform:scaleY(0.35)} 50%{transform:scaleY(1)} }
        @keyframes sp-eq-2 { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.4)} }
        @keyframes sp-eq-3 { 0%,100%{transform:scaleY(0.6)} 40%{transform:scaleY(1)} 70%{transform:scaleY(0.3)} }
      `), bars.map((h, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: barW,
      height: '100%',
      background: color,
      borderRadius: 1,
      transformOrigin: 'bottom',
      transform: `scaleY(${h})`,
      animation: animated ? `sp-eq-${i + 1} 0.9s ease-in-out ${i * 0.15}s infinite` : 'none'
    }
  })));
}
Object.assign(__ds_scope, { Equalizer, __ds_default_components_feedback_Equalizer_1wdvoqo: Equalizer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Equalizer.jsx", error: String((e && e.message) || e) }); }

// components/icons/icon-data.js
try { (() => {
// Generated by fig_materialize (moduleFormat: 'icon-data') — 39 icon(s)
// as { viewBox, body } SVG-markup entries. Render via the sibling Icon.jsx
// (<Icon name="Album" />), or consume the path data directly.
let __ds_default_components_icons_icon_data_12stud1;
try {
  __ds_default_components_icons_icon_data_12stud1 = {
    "Album": {
      viewBox: "0 0 16 16",
      body: "<path d=\"M 15 8 C 15 11.866 11.866 15 8 15 C 4.134 15 1 11.866 1 8 C 1 4.134 4.134 1 8 1 C 11.866 1 15 4.134 15 8 Z M 16 8 C 16 12.418 12.418 16 8 16 C 3.582 16 0 12.418 0 8 C 0 3.582 3.582 0 8 0 C 12.418 0 16 3.582 16 8 Z M 11 8 C 11 9.657 9.657 11 8 11 C 6.343 11 5 9.657 5 8 C 5 6.343 6.343 5 8 5 C 9.657 5 11 6.343 11 8 Z M 12 8 C 12 10.209 10.209 12 8 12 C 5.791 12 4 10.209 4 8 C 4 5.791 5.791 4 8 4 C 10.209 4 12 5.791 12 8 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"/>"
    },
    "Album2": {
      viewBox: "0 0 20 20",
      body: "<path d=\"M 18.75 10 C 18.75 14.832 14.832 18.75 10 18.75 C 5.168 18.75 1.25 14.832 1.25 10 C 1.25 5.168 5.168 1.25 10 1.25 C 14.832 1.25 18.75 5.168 18.75 10 Z M 20 10 C 20 15.523 15.523 20 10 20 C 4.477 20 0 15.523 0 10 C 0 4.477 4.477 0 10 0 C 15.523 0 20 4.477 20 10 Z M 13.75 10 C 13.75 12.071 12.071 13.75 10 13.75 C 7.929 13.75 6.25 12.071 6.25 10 C 6.25 7.929 7.929 6.25 10 6.25 C 12.071 6.25 13.75 7.929 13.75 10 Z M 15 10 C 15 12.761 12.761 15 10 15 C 7.239 15 5 12.761 5 10 C 5 7.239 7.239 5 10 5 C 12.761 5 15 7.239 15 10 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"/>"
    },
    "Back": {
      viewBox: "0 0 16 16",
      body: "<path d=\"M 10 0 L 2 4.619 L 2 0.5 L 0 0.5 L 0 10.5 L 2 10.5 L 2 6.381 L 10 11 L 10 0 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 3 3)\"/>"
    },
    "ChevronLeft": {
      viewBox: "0 0 40 40",
      body: "<path d=\"M 22.248 38 L 0 19 L 22.248 0 L 23.633 1.619 L 3.28 19 L 23.633 36.381\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 8.184 1)\"/>"
    },
    "Component10": {
      viewBox: "0 0 17.670 17.670",
      body: "<path d=\"M 8.835 16.565 C 13.104 16.565 16.565 13.104 16.565 8.835 C 16.565 4.565 13.104 1.104 8.835 1.104 C 4.565 1.104 1.104 4.565 1.104 8.835 C 1.104 13.104 4.565 16.565 8.835 16.565 Z M 8.835 17.67 C 13.714 17.67 17.67 13.714 17.67 8.835 C 17.67 3.955 13.714 0 8.835 0 C 3.955 0 0 3.955 0 8.835 C 0 13.714 3.955 17.67 8.835 17.67 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"/><path d=\"M 0 0 L 11.244 0 L 11.244 0.803 L 0 0.803 L 0 0 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 3.213 8.032)\"/>"
    },
    "Forward": {
      viewBox: "0 0 17.455 17.455",
      body: "<path d=\"M 10.909 0 L 2.182 5.039 L 2.182 0.545 L 0 0.545 L 0 11.455 L 2.182 11.455 L 2.182 6.961 L 10.909 12 L 10.909 0 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(-1 0 0 1 14.182 3.273)\"/>"
    },
    "FullScreen": {
      viewBox: "0 0 17.455 17.455",
      body: "<path d=\"M 4.433 8.977 L 1.796 11.615 L 0 9.818 L 0 14.182 L 4.364 14.182 L 2.567 12.386 L 5.205 9.748 L 4.433 8.977 Z M 9.818 0 L 11.615 1.797 L 8.977 4.435 L 9.748 5.206 L 12.386 2.568 L 14.182 4.364 L 14.182 0 L 9.818 0 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 2.182 2.182)\"/>"
    },
    "FullScreen2": {
      viewBox: "0 0 17.455 17.455",
      body: "<path d=\"M 4.364 2.727 L 0 5.455 L 0 0 L 4.364 2.727 Z M 15.273 3.273 L 7.636 3.273 L 7.636 4.364 L 15.273 4.364 L 15.273 3.273 Z M 15.273 7.636 L 15.273 8.727 L 0 8.727 L 0 7.636 L 15.273 7.636 Z M 15.273 13.091 L 15.273 12 L 0 12 L 0 13.091 L 15.273 13.091 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 1.091 2.182)\"/>"
    },
    "HeartSolid": {
      viewBox: "0 0 17.455 17.455",
      body: "<path d=\"M 15.962 1.5 C 15.068 0.598 13.868 0.065 12.599 0.006 C 11.33 -0.052 10.086 0.368 9.113 1.184 C 9.001 1.268 8.866 1.317 8.726 1.324 C 8.585 1.32 8.449 1.271 8.338 1.184 C 7.365 0.368 6.121 -0.053 4.852 0.005 C 3.584 0.064 2.384 0.597 1.49 1.5 C 0.529 2.461 0 3.739 0 5.098 C 0 6.457 0.529 7.735 1.458 8.661 L 7.026 15.179 C 7.236 15.425 7.497 15.623 7.791 15.758 C 8.084 15.894 8.404 15.964 8.727 15.964 C 9.051 15.964 9.37 15.894 9.664 15.758 C 9.958 15.623 10.218 15.425 10.428 15.179 L 15.963 8.696 C 16.437 8.224 16.813 7.664 17.069 7.046 C 17.325 6.428 17.456 5.766 17.455 5.098 C 17.456 4.429 17.324 3.767 17.068 3.149 C 16.812 2.532 16.436 1.971 15.962 1.5 L 15.962 1.5 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 -0.000 1.091)\"/>"
    },
    "HomeFilled": {
      viewBox: "0 0 22 22",
      body: "<path d=\"M 18.788 20.9 L 11.481 20.9 L 11.481 13.475 L 7.306 13.475 L 7.306 20.9 L 0 20.9 L 0 5.467 L 9.394 0 L 18.788 5.43 L 18.788 20.9 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 0 0.957)\"/>"
    },
    "HomeOutline": {
      viewBox: "0 0 16.667 16.667",
      body: "<path d=\"M 7.476 0.968 L 0.787 5.068 L 0.787 15.837 L 5.025 15.837 L 5.025 10.028 L 9.964 10.028 L 9.964 15.837 L 14.165 15.837 L 14.165 5.039 L 7.476 0.968 Z M 7.476 0 L 14.952 4.403 L 14.952 16.667 L 9.177 16.667 L 9.177 10.858 L 5.812 10.858 L 5.812 16.667 L 0 16.667 L 0 4.443 L 7.476 0 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 1.042 0)\"/>"
    },
    "HomeSolid": {
      viewBox: "0 0 16.670 16.670",
      body: "<path d=\"M 15.003 16.67 L 9.169 16.67 L 9.169 10.842 L 5.834 10.842 L 5.834 16.67 L 0 16.67 L 0 4.361 L 7.502 0 L 15.003 4.331 L 15.003 16.67 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 1.042 0)\"/>"
    },
    "IconChevronDown": {
      viewBox: "0 0 24 24",
      body: "<path d=\"M 0 0 L 24 0 L 24 24 L 0 24 L 0 0 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"/><path d=\"M 0.707 -0.707 C 0.317 -1.098 -0.317 -1.098 -0.707 -0.707 C -1.098 -0.317 -1.098 0.317 -0.707 0.707 L 0.707 -0.707 Z M 6 6 L 5.293 6.707 C 5.683 7.098 6.317 7.098 6.707 6.707 L 6 6 Z M 12.707 0.707 C 13.098 0.317 13.098 -0.317 12.707 -0.707 C 12.317 -1.098 11.683 -1.098 11.293 -0.707 L 12.707 0.707 Z M -0.707 0.707 L 5.293 6.707 L 6.707 5.293 L 0.707 -0.707 L -0.707 0.707 Z M 6.707 6.707 L 12.707 0.707 L 11.293 -0.707 L 5.293 5.293 L 6.707 6.707 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 6 9)\"/>"
    },
    "IconChevronLeft": {
      viewBox: "0 0 24 24",
      body: "<path d=\"M 0 0 L 24 0 L 24 24 L 0 24 L 0 0 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"/><path d=\"M 6.707 0.707 C 7.098 0.317 7.098 -0.317 6.707 -0.707 C 6.317 -1.098 5.683 -1.098 5.293 -0.707 L 6.707 0.707 Z M 0 6 L -0.707 5.293 C -1.098 5.683 -1.098 6.317 -0.707 6.707 L 0 6 Z M 5.293 12.707 C 5.683 13.098 6.317 13.098 6.707 12.707 C 7.098 12.317 7.098 11.683 6.707 11.293 L 5.293 12.707 Z M 5.293 -0.707 L -0.707 5.293 L 0.707 6.707 L 6.707 0.707 L 5.293 -0.707 Z M -0.707 6.707 L 5.293 12.707 L 6.707 11.293 L 0.707 5.293 L -0.707 6.707 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 9 6)\"/>"
    },
    "IconChevronRight": {
      viewBox: "0 0 24 24",
      body: "<path d=\"M 0 0 L 24 0 L 24 24 L 0 24 L 0 0 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"/><path d=\"M 0.707 -0.707 C 0.317 -1.098 -0.317 -1.098 -0.707 -0.707 C -1.098 -0.317 -1.098 0.317 -0.707 0.707 L 0.707 -0.707 Z M 6 6 L 6.707 6.707 C 7.098 6.317 7.098 5.683 6.707 5.293 L 6 6 Z M -0.707 11.293 C -1.098 11.683 -1.098 12.317 -0.707 12.707 C -0.317 13.098 0.317 13.098 0.707 12.707 L -0.707 11.293 Z M -0.707 0.707 L 5.293 6.707 L 6.707 5.293 L 0.707 -0.707 L -0.707 0.707 Z M 5.293 5.293 L -0.707 11.293 L 0.707 12.707 L 6.707 6.707 L 5.293 5.293 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 9 6)\"/>"
    },
    "IconChevronUp": {
      viewBox: "0 0 24 24",
      body: "<path d=\"M 0 0 L 24 0 L 24 24 L 0 24 L 0 0 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"/><path d=\"M -0.707 5.293 C -1.098 5.683 -1.098 6.317 -0.707 6.707 C -0.317 7.098 0.317 7.098 0.707 6.707 L -0.707 5.293 Z M 6 0 L 6.707 -0.707 C 6.317 -1.098 5.683 -1.098 5.293 -0.707 L 6 0 Z M 11.293 6.707 C 11.683 7.098 12.317 7.098 12.707 6.707 C 13.098 6.317 13.098 5.683 12.707 5.293 L 11.293 6.707 Z M 0.707 6.707 L 6.707 0.707 L 5.293 -0.707 L -0.707 5.293 L 0.707 6.707 Z M 5.293 0.707 L 11.293 6.707 L 12.707 5.293 L 6.707 -0.707 L 5.293 0.707 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 6 9)\"/>"
    },
    "IconSettings": {
      viewBox: "0 0 24 24",
      body: "<path d=\"M 0 0 L 24 0 L 24 24 L 0 24 L 0 0 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"/><path d=\"M 7.325 1.317 L 7.811 1.435 L 7.811 1.435 L 7.325 1.317 Z M 10.675 1.317 L 11.161 1.199 L 11.161 1.199 L 10.675 1.317 Z M 13.248 2.383 L 12.988 1.956 L 12.988 1.956 L 13.248 2.383 Z M 15.618 4.753 L 16.045 5.013 L 16.045 5.013 L 15.618 4.753 Z M 16.683 7.325 L 16.565 7.811 L 16.565 7.811 L 16.683 7.325 Z M 16.683 10.675 L 16.801 11.161 L 16.801 11.161 L 16.683 10.675 Z M 15.617 13.248 L 16.044 12.988 L 16.044 12.988 L 15.617 13.248 Z M 13.247 15.618 L 12.987 16.045 L 12.987 16.045 L 13.247 15.618 Z M 10.675 16.683 L 10.189 16.565 L 10.189 16.565 L 10.675 16.683 Z M 7.325 16.683 L 6.839 16.801 L 6.839 16.801 L 7.325 16.683 Z M 4.752 15.617 L 5.012 16.044 L 5.012 16.044 L 4.752 15.617 Z M 2.382 13.247 L 1.955 12.987 L 1.955 12.987 L 2.382 13.247 Z M 1.317 10.675 L 1.435 10.189 L 1.435 10.189 L 1.317 10.675 Z M 1.317 7.325 L 1.199 6.839 L 1.199 6.839 L 1.317 7.325 Z M 2.383 4.752 L 1.956 5.012 L 1.956 5.012 L 2.383 4.752 Z M 4.753 2.382 L 4.493 2.809 L 4.493 2.809 L 4.753 2.382 Z M 7.811 1.435 C 8.113 0.188 9.887 0.188 10.189 1.435 L 11.161 1.199 C 10.611 -1.066 7.389 -1.066 6.839 1.199 L 7.811 1.435 Z M 10.189 1.435 C 10.272 1.775 10.433 2.091 10.661 2.357 L 11.421 1.707 C 11.295 1.56 11.206 1.387 11.161 1.199 L 10.189 1.435 Z M 10.661 2.357 C 10.889 2.623 11.176 2.832 11.499 2.966 L 11.882 2.042 C 11.704 1.968 11.546 1.853 11.421 1.707 L 10.661 2.357 Z M 11.499 2.966 C 11.823 3.1 12.173 3.155 12.522 3.128 L 12.445 2.131 C 12.253 2.146 12.06 2.116 11.882 2.042 L 11.499 2.966 Z M 12.522 3.128 C 12.872 3.101 13.209 2.992 13.508 2.81 L 12.988 1.956 C 12.823 2.056 12.637 2.116 12.445 2.131 L 12.522 3.128 Z M 13.508 2.81 C 14.604 2.143 15.858 3.397 15.191 4.493 L 16.045 5.013 C 17.258 3.021 14.978 0.743 12.988 1.956 L 13.508 2.81 Z M 15.191 4.493 C 15.009 4.792 14.9 5.129 14.873 5.478 L 15.87 5.555 C 15.885 5.363 15.945 5.178 16.045 5.013 L 15.191 4.493 Z M 14.873 5.478 C 14.846 5.827 14.902 6.177 15.036 6.501 L 15.959 6.118 C 15.886 5.94 15.855 5.747 15.87 5.555 L 14.873 5.478 Z M 15.036 6.501 C 15.169 6.824 15.378 7.111 15.643 7.339 L 16.294 6.579 C 16.148 6.454 16.033 6.296 15.959 6.118 L 15.036 6.501 Z M 15.643 7.339 C 15.909 7.566 16.225 7.728 16.565 7.811 L 16.801 6.839 C 16.614 6.794 16.44 6.705 16.294 6.579 L 15.643 7.339 Z M 16.565 7.811 C 17.812 8.113 17.812 9.887 16.565 10.189 L 16.801 11.161 C 19.066 10.611 19.066 7.389 16.801 6.839 L 16.565 7.811 Z M 16.565 10.189 C 16.225 10.272 15.909 10.433 15.643 10.661 L 16.293 11.421 C 16.44 11.295 16.613 11.206 16.801 11.161 L 16.565 10.189 Z M 15.643 10.661 C 15.377 10.889 15.168 11.176 15.034 11.499 L 15.958 11.882 C 16.032 11.704 16.147 11.546 16.293 11.421 L 15.643 10.661 Z M 15.034 11.499 C 14.9 11.823 14.845 12.173 14.872 12.522 L 15.869 12.445 C 15.854 12.253 15.884 12.06 15.958 11.882 L 15.034 11.499 Z M 14.872 12.522 C 14.899 12.872 15.008 13.209 15.19 13.508 L 16.044 12.988 C 15.944 12.823 15.884 12.637 15.869 12.445 L 14.872 12.522 Z M 15.19 13.508 C 15.857 14.604 14.603 15.858 13.507 15.191 L 12.987 16.045 C 14.979 17.258 17.257 14.978 16.044 12.988 L 15.19 13.508 Z M 13.507 15.191 C 13.208 15.009 12.871 14.9 12.522 14.873 L 12.445 15.87 C 12.637 15.885 12.822 15.945 12.987 16.045 L 13.507 15.191 Z M 12.522 14.873 C 12.173 14.846 11.823 14.902 11.499 15.036 L 11.882 15.959 C 12.06 15.886 12.253 15.855 12.445 15.87 L 12.522 14.873 Z M 11.499 15.036 C 11.176 15.169 10.889 15.378 10.661 15.643 L 11.421 16.294 C 11.546 16.148 11.704 16.033 11.882 15.959 L 11.499 15.036 Z M 10.661 15.643 C 10.434 15.909 10.272 16.225 10.189 16.565 L 11.161 16.801 C 11.206 16.614 11.295 16.44 11.421 16.294 L 10.661 15.643 Z M 10.189 16.565 C 9.887 17.812 8.113 17.812 7.811 16.565 L 6.839 16.801 C 7.389 19.066 10.611 19.066 11.161 16.801 L 10.189 16.565 Z M 7.811 16.565 C 7.728 16.225 7.567 15.909 7.339 15.643 L 6.579 16.293 C 6.705 16.44 6.794 16.613 6.839 16.801 L 7.811 16.565 Z M 7.339 15.643 C 7.111 15.377 6.824 15.168 6.501 15.034 L 6.118 15.958 C 6.296 16.032 6.454 16.147 6.579 16.293 L 7.339 15.643 Z M 6.501 15.034 C 6.177 14.9 5.827 14.845 5.478 14.872 L 5.555 15.869 C 5.747 15.854 5.94 15.884 6.118 15.958 L 6.501 15.034 Z M 5.478 14.872 C 5.128 14.899 4.791 15.008 4.492 15.19 L 5.012 16.044 C 5.177 15.944 5.363 15.884 5.555 15.869 L 5.478 14.872 Z M 4.492 15.19 C 3.396 15.857 2.142 14.603 2.809 13.507 L 1.955 12.987 C 0.742 14.979 3.022 17.257 5.012 16.044 L 4.492 15.19 Z M 2.809 13.507 C 2.991 13.208 3.1 12.871 3.127 12.522 L 2.13 12.445 C 2.115 12.637 2.055 12.822 1.955 12.987 L 2.809 13.507 Z M 3.127 12.522 C 3.154 12.173 3.098 11.823 2.964 11.499 L 2.041 11.882 C 2.114 12.06 2.145 12.253 2.13 12.445 L 3.127 12.522 Z M 2.964 11.499 C 2.831 11.176 2.622 10.889 2.357 10.661 L 1.706 11.421 C 1.852 11.546 1.967 11.704 2.041 11.882 L 2.964 11.499 Z M 2.357 10.661 C 2.091 10.434 1.775 10.272 1.435 10.189 L 1.199 11.161 C 1.386 11.206 1.56 11.295 1.706 11.421 L 2.357 10.661 Z M 1.435 10.189 C 0.188 9.887 0.188 8.113 1.435 7.811 L 1.199 6.839 C -1.066 7.389 -1.066 10.611 1.199 11.161 L 1.435 10.189 Z M 1.435 7.811 C 1.775 7.728 2.091 7.567 2.357 7.339 L 1.707 6.579 C 1.56 6.705 1.387 6.794 1.199 6.839 L 1.435 7.811 Z M 2.357 7.339 C 2.623 7.111 2.832 6.824 2.966 6.501 L 2.042 6.118 C 1.968 6.296 1.853 6.454 1.707 6.579 L 2.357 7.339 Z M 2.966 6.501 C 3.1 6.177 3.155 5.827 3.128 5.478 L 2.131 5.555 C 2.146 5.747 2.116 5.94 2.042 6.118 L 2.966 6.501 Z M 3.128 5.478 C 3.101 5.128 2.992 4.791 2.81 4.492 L 1.956 5.012 C 2.056 5.177 2.116 5.363 2.131 5.555 L 3.128 5.478 Z M 2.81 4.492 C 2.143 3.396 3.397 2.142 4.493 2.809 L 5.013 1.955 C 3.021 0.742 0.743 3.022 1.956 5.012 L 2.81 4.492 Z M 4.493 2.809 C 5.782 3.593 7.455 2.899 7.811 1.435 L 6.839 1.199 C 6.643 2.005 5.724 2.387 5.013 1.955 L 4.493 2.809 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 3 3)\"/><path d=\"M 5.5 3 C 5.5 4.381 4.381 5.5 3 5.5 L 3 6.5 C 4.933 6.5 6.5 4.933 6.5 3 L 5.5 3 Z M 3 5.5 C 1.619 5.5 0.5 4.381 0.5 3 L -0.5 3 C -0.5 4.933 1.067 6.5 3 6.5 L 3 5.5 Z M 0.5 3 C 0.5 1.619 1.619 0.5 3 0.5 L 3 -0.5 C 1.067 -0.5 -0.5 1.067 -0.5 3 L 0.5 3 Z M 3 0.5 C 4.381 0.5 5.5 1.619 5.5 3 L 6.5 3 C 6.5 1.067 4.933 -0.5 3 -0.5 L 3 0.5 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 9 9)\"/>"
    },
    "IconsAppsAppStoreMore": {
      viewBox: "0 0 28 28",
      body: "<path d=\"M 2 4 C 3.105 4 4 3.104 4 2 C 4 0.896 3.105 0 2 0 C 0.895 0 0 0.896 0 2 C 0 3.104 0.895 4 2 4 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 6 12)\"/><path d=\"M 8 4 C 9.105 4 10 3.104 10 2 C 10 0.896 9.105 0 8 0 C 6.895 0 6 0.896 6 2 C 6 3.104 6.895 4 8 4 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 6 12)\"/><path d=\"M 16 2 C 16 3.104 15.105 4 14 4 C 12.895 4 12 3.104 12 2 C 12 0.896 12.895 0 14 0 C 15.105 0 16 0.896 16 2 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 6 12)\"/>"
    },
    "IconsAppsInstagramAdd": {
      viewBox: "0 0 26 26",
      body: "<path d=\"M 10.214 0 L 8.357 0 L 8.357 8.357 L 0 8.357 L 0 10.214 L 8.357 10.214 L 8.357 18.571 L 10.214 18.571 L 10.214 10.214 L 18.571 10.214 L 18.571 8.357 L 10.214 8.357 L 10.214 0 L 10.214 0 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 3.714 4.179)\"/>"
    },
    "IconsAppsMusicAirplay": {
      viewBox: "0 0 36 35",
      body: "<path d=\"M 10.363 0 L 20.726 11.192 L 0 11.192 L 10.363 0 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 7.637 20.058)\"/><path d=\"M 5.671 22.102 C 3.268 19.893 1.886 16.849 1.886 13.59 C 1.886 7.085 7.373 1.812 14.143 1.812 C 20.912 1.812 26.4 7.085 26.4 13.59 C 26.4 16.849 25.017 19.893 22.615 22.102 L 23.919 23.411 C 26.689 20.864 28.286 17.348 28.286 13.59 C 28.286 6.085 21.954 0 14.143 0 C 6.332 0 0 6.085 0 13.59 C 0 17.348 1.597 20.864 4.367 23.411 L 5.671 22.102 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 3.857 3.125)\"/><path d=\"M 4.312 14.818 C 2.772 13.402 1.886 11.451 1.886 9.362 C 1.886 5.192 5.403 1.812 9.743 1.812 C 14.082 1.812 17.6 5.192 17.6 9.362 C 17.6 11.451 16.714 13.402 15.174 14.818 L 16.477 16.127 C 18.386 14.373 19.486 11.951 19.486 9.362 C 19.486 4.192 15.124 0 9.743 0 C 4.362 0 0 4.192 0 9.362 C 0 11.951 1.1 14.373 3.008 16.127 L 4.312 14.818 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 8.257 7.350)\"/><path d=\"M 2.953 7.535 C 2.275 6.911 1.886 6.054 1.886 5.134 C 1.886 3.299 3.434 1.812 5.343 1.812 C 7.252 1.812 8.8 3.299 8.8 5.134 C 8.8 6.054 8.41 6.911 7.732 7.535 L 9.036 8.844 C 10.082 7.882 10.686 6.553 10.686 5.134 C 10.686 2.299 8.294 0 5.343 0 C 2.392 0 0 2.299 0 5.134 C 0 6.553 0.604 7.882 1.65 8.844 L 2.953 7.535 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 12.657 11.575)\"/>"
    },
    "IconsControlCenterBluetooth": {
      viewBox: "0 0 29 29",
      body: "<path d=\"M 5.276 11.496 L 5.276 18.529 C 5.276 19.23 6.11 19.597 6.626 19.123 L 11.46 14.693 C 11.808 14.373 11.808 13.824 11.46 13.505 L 7.274 9.668 L 11.46 5.832 C 11.808 5.512 11.808 4.963 11.46 4.644 L 6.626 0.213 C 6.11 -0.26 5.276 0.106 5.276 0.807 L 5.276 7.84 L 1.35 4.241 C 1.022 3.941 0.512 3.963 0.212 4.291 C -0.089 4.619 -0.067 5.128 0.261 5.429 L 4.886 9.668 L 0.261 13.908 C -0.067 14.209 -0.089 14.718 0.212 15.046 C 0.512 15.374 1.022 15.396 1.35 15.096 L 5.276 11.496 Z M 6.887 7.837 L 9.723 5.238 L 6.887 2.639 L 6.887 7.837 Z M 9.723 14.099 L 6.887 16.698 L 6.887 11.5 L 9.723 14.099 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 8.426 4.833)\"/>"
    },
    "IconsControlCenterOrientationLock": {
      viewBox: "0 0 19.238 19.845",
      body: "<path d=\"M 15.675 5.863 C 14.181 2.377 10.417 0.388 6.741 1.337 C 2.668 2.388 0.246 6.645 1.33 10.845 C 2.414 15.046 6.594 17.6 10.666 16.549 C 12.648 16.037 14.296 14.748 15.305 12.976 C 15.453 12.715 15.781 12.631 16.037 12.787 C 16.292 12.943 16.38 13.281 16.231 13.543 C 15.081 15.562 13.201 17.033 10.941 17.616 C 6.297 18.815 1.531 15.903 0.295 11.113 C -0.941 6.322 1.821 1.468 6.465 0.269 C 10.714 -0.827 15.065 1.517 16.722 5.593 L 18.442 5.149 L 17.233 9.446 L 14.096 6.271 L 15.675 5.863 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 -0.071 0.308)\"/><path d=\"M 0 0.444 C 0 0.199 0.199 0 0.444 0 L 0.444 0 C 0.689 0 0.888 0.199 0.888 0.444 L 0.888 5.325 C 0.888 5.57 0.689 5.769 0.444 5.769 L 0.444 5.769 C 0.199 5.769 0 5.57 0 5.325 L 0 0.444 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(-1 -0.008 -0.008 1 9.609 3.471)\"/><path d=\"M 0 0.444 C 0 0.199 0.199 0 0.444 0 L 0.444 0 C 0.689 0 0.888 0.199 0.888 0.444 L 0.888 5.103 C 0.888 5.348 0.689 5.547 0.444 5.547 L 0.444 5.547 C 0.199 5.547 0 5.348 0 5.103 L 0 0.444 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(-0.725 -0.689 -0.689 0.725 9.564 8.958)\"/>"
    },
    "IconsSystemStatusBarBattery": {
      viewBox: "0 0 32 14",
      body: "<path d=\"M 2.5 0 L 21.5 0 C 22.881 0 24 1.119 24 2.5 L 24 9 C 24 10.381 22.881 11.5 21.5 11.5 L 2.5 11.5 C 1.119 11.5 0 10.381 0 9 L 0 2.5 C 0 1.119 1.119 0 2.5 0 Z M 2.5 1 C 1.672 1 1 1.672 1 2.5 L 1 9 C 1 9.828 1.672 10.5 2.5 10.5 L 21.5 10.5 C 22.328 10.5 23 9.828 23 9 L 23 2.5 C 23 1.672 22.328 1 21.5 1 L 2.5 1 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 3 1.500)\"/><path d=\"M 0 0 C 0.89 0.455 1.5 1.381 1.5 2.45 C 1.5 3.519 0.89 4.445 0 4.9 L 0 0 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 3 1.500) matrix(1 0 0 1 25 3.300)\"/><path d=\"M 1 0 L 19 0 C 19.552 0 20 0.448 20 1 L 20 6.5 C 20 7.052 19.552 7.5 19 7.5 L 1 7.5 C 0.448 7.5 0 7.052 0 6.5 L 0 1 C 0 0.448 0.448 0 1 0 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 3 1.500) matrix(1 0 0 1 2 2)\"/>"
    },
    "IconsSystemStatusBarLocation": {
      viewBox: "0 0 14 14",
      body: "<path d=\"M 5.978 10.54 L 10.54 0 L 0 4.562 L 5.978 4.562 L 5.978 10.54 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 1.700 2.250)\"/>"
    },
    "IconsSystemStatusBarSignal": {
      viewBox: "0 0 21 14",
      body: "<path d=\"M 1 0 L 2 0 C 2.552 0 3 0.448 3 1 L 3 9 C 3 9.552 2.552 10 2 10 L 1 10 C 0.448 10 0 9.552 0 9 L 0 1 C 0 0.448 0.448 0 1 0 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 15.500 2)\"/><path d=\"M 11 0 L 10 0 C 9.448 0 9 0.448 9 1 L 9 7 C 9 7.552 9.448 8 10 8 L 11 8 C 11.552 8 12 7.552 12 7 L 12 1 C 12 0.448 11.552 0 11 0 Z M 5.5 2 L 6.5 2 C 7.052 2 7.5 2.448 7.5 3 L 7.5 7 C 7.5 7.552 7.052 8 6.5 8 L 5.5 8 C 4.948 8 4.5 7.552 4.5 7 L 4.5 3 C 4.5 2.448 4.948 2 5.5 2 Z M 1 3.5 L 2 3.5 C 2.552 3.5 3 3.948 3 4.5 L 3 7 C 3 7.552 2.552 8 2 8 L 1 8 C 0.448 8 0 7.552 0 7 L 0 4.5 C 0 3.948 0.448 3.5 1 3.5 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 2 4)\"/>"
    },
    "IconsSystemStatusBarWifi": {
      viewBox: "0 0 15 14",
      body: "<path d=\"M 13.983 2.523 C 12.072 0.891 9.657 0 7.133 0 C 4.601 0 2.18 0.896 0.266 2.537 L 0.104 2.676 C -0.028 2.789 -0.035 2.99 0.087 3.112 L 1.214 4.236 C 1.324 4.345 1.498 4.352 1.617 4.253 L 1.756 4.135 C 3.263 2.869 5.155 2.18 7.133 2.18 C 9.104 2.18 10.989 2.865 12.494 4.123 L 12.634 4.24 C 12.752 4.338 12.926 4.331 13.036 4.222 L 14.163 3.098 C 14.285 2.976 14.278 2.775 14.146 2.662 L 13.983 2.523 Z M 7.133 3.47 C 8.724 3.47 10.251 3.998 11.495 4.975 L 11.671 5.113 C 11.811 5.223 11.824 5.431 11.697 5.556 L 10.567 6.684 C 10.462 6.788 10.297 6.8 10.178 6.712 L 10.04 6.61 C 9.2 5.985 8.186 5.65 7.133 5.65 C 6.073 5.65 5.053 5.989 4.21 6.621 L 4.072 6.724 C 3.954 6.813 3.787 6.802 3.683 6.697 L 2.552 5.57 C 2.426 5.444 2.438 5.237 2.578 5.127 L 2.753 4.989 C 4 4.003 5.534 3.47 7.133 3.47 Z M 7.133 6.94 C 7.772 6.94 8.394 7.108 8.941 7.428 L 9.163 7.558 C 9.331 7.656 9.361 7.887 9.223 8.024 L 7.329 9.913 C 7.212 10.029 7.024 10.029 6.907 9.913 L 5.026 8.036 C 4.888 7.899 4.917 7.67 5.084 7.571 L 5.303 7.441 C 5.856 7.112 6.485 6.94 7.133 6.94 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 0 2)\"/>"
    },
    "LibraryOutline": {
      viewBox: "0 0 16.667 16.667",
      body: "<path d=\"M 9.624 0.086 L 16.667 15.903 L 15.849 16.269 L 8.806 0.452 L 9.624 0.086 Z M 0 16.258 L 0 0 L 0.903 0 L 0.903 16.258 L 0 16.258 Z M 5.419 16.258 L 5.419 0 L 6.323 0 L 6.323 16.258 L 5.419 16.258 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 0 -0.000)\"/>"
    },
    "LibrarySmall": {
      viewBox: "0 0 22 22",
      body: "<path d=\"M 12.068 0.108 L 20.9 19.943 L 19.875 20.401 L 11.043 0.566 L 12.068 0.108 Z M 0 20.388 L 0 0 L 1.133 0 L 1.133 20.388 L 0 20.388 Z M 6.796 20.388 L 6.796 0 L 7.929 0 L 7.929 20.388 L 6.796 20.388 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 0.550 0.799)\"/>"
    },
    "LibrarySolid": {
      viewBox: "0 0 16.670 16.670",
      body: "<path d=\"M 9.975 0 L 16.67 14.938 L 15.096 15.628 L 8.401 0.691 L 9.975 0 Z M 0 15.445 L 0 0.091 L 1.717 0.091 L 1.717 15.445 L 0 15.445 Z M 4.293 15.445 L 4.293 0.091 L 6.01 0.091 L 6.01 15.445 L 4.293 15.445 L 4.293 15.445 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 0 1.042)\"/>"
    },
    "ListeningOn": {
      viewBox: "0 0 16 16",
      body: "<path d=\"M 3.001 10 L 13.001 10 C 13.551 10 14.001 9.55 14.001 9 L 14.001 1 C 14.001 0.45 13.551 0 13.001 0 L 3.001 0 C 2.451 0 2.001 0.45 2.001 1 L 2.001 9 C 2.001 9.55 2.451 10 3.001 10 L 3.001 10 Z M 3.001 1 L 13.001 1 L 13.001 9 L 3.001 9 L 3.001 1 L 3.001 1 Z M 15.501 12 L 0.5 12 C 0.225 12 0 12.225 0 12.5 C 0 12.775 0.225 13 0.5 13 L 15.501 13 C 15.776 13 16.001 12.775 16.001 12.5 C 16.001 12.225 15.776 12 15.501 12 L 15.501 12 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 0 2)\"/>"
    },
    "ListeningOn2": {
      viewBox: "0 0 16 16",
      body: "<path d=\"M 13.055 0 L 12.398 0.77 C 13.988 2.244 14.99 4.344 14.99 6.677 C 14.99 9.011 13.987 11.111 12.398 12.585 L 13.054 13.355 C 13.982 12.508 14.724 11.476 15.231 10.327 C 15.738 9.177 16 7.934 16 6.678 C 16 5.421 15.738 4.178 15.231 3.029 C 14.724 1.879 13.983 0.847 13.055 0 L 13.055 0 Z M 10.764 2.683 L 10.107 3.452 C 10.536 3.873 10.876 4.375 11.108 4.929 C 11.34 5.483 11.46 6.078 11.46 6.678 C 11.46 7.279 11.34 7.873 11.108 8.427 C 10.875 8.981 10.535 9.483 10.106 9.904 L 10.763 10.673 C 11.812 9.665 12.468 8.249 12.468 6.678 C 12.468 5.108 11.813 3.691 10.764 2.683 L 10.764 2.683 Z M 0 3.652 L 0 9.703 L 2.828 9.703 L 8.068 12.729 L 8.068 0.626 L 2.828 3.652 L 0 3.652 Z M 7.06 2.373 L 7.06 10.982 L 3.098 8.695 L 1.009 8.695 L 1.009 4.66 L 3.098 4.66 L 7.06 2.373 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 0 1)\"/>"
    },
    "Play": {
      viewBox: "0 0 16 16",
      body: "<path d=\"M 16 8 C 16 12.418 12.418 16 8 16 C 3.582 16 0 12.418 0 8 C 0 3.582 3.582 0 8 0 C 12.418 0 16 3.582 16 8 Z\" fill=\"rgb(255,255,255)\" fill-rule=\"nonzero\"/><path d=\"M 0 6 L 5.25 3 L 0 0 L 0 6 Z\" fill=\"rgb(25,20,20)\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 6 5)\"/>"
    },
    "PlayingRightNow": {
      viewBox: "0 0 18.600 18.600",
      body: "<path d=\"M 3.487 0 L 4.65 0 L 4.65 13.95 L 3.487 13.95 L 3.487 0 Z M 0 3.487 L 1.162 3.487 L 1.162 13.95 L 0 13.95 L 0 3.487 Z M 8.137 9.3 L 6.975 9.3 L 6.975 13.95 L 8.137 13.95 L 8.137 9.3 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 3.487 2.325)\"/>"
    },
    "Repeat": {
      viewBox: "0 0 16 16",
      body: "<path d=\"M 4.5 2.5 L 9 2.5 L 9 4 L 12.5 2 L 9 0 L 9 1.5 L 4.5 1.5 C 2 1.5 0 3.5 0 6 C 0 6.6 0.1 7.2 0.4 7.8 L 1.3 7.3 C 1.1 6.9 1 6.5 1 6 C 1 4.1 2.6 2.5 4.5 2.5 Z M 13.6 4.2 L 12.7 4.7 C 12.9 5.1 13 5.5 13 6 C 13 7.9 11.4 9.5 9.5 9.5 L 5 9.5 L 5 8 L 1.5 10 L 5 12 L 5 10.5 L 9.5 10.5 C 12 10.5 14 8.5 14 6 C 14 5.4 13.9 4.8 13.6 4.2 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 1 2)\"/>"
    },
    "SearchOutline": {
      viewBox: "0 0 13.400 13.400",
      body: "<path d=\"M 9.441 9.589 L 12.322 12.97 L 11.822 13.4 L 8.933 10.019 C 7.939 10.773 6.82 11.151 5.575 11.151 C 4.821 11.151 4.098 11.004 3.409 10.71 C 2.719 10.416 2.125 10.02 1.628 9.523 C 1.131 9.026 0.735 8.432 0.441 7.742 C 0.147 7.053 0 6.33 0 5.575 C 0 4.821 0.147 4.098 0.441 3.409 C 0.735 2.719 1.131 2.125 1.628 1.628 C 2.125 1.131 2.719 0.735 3.409 0.441 C 4.098 0.147 4.821 0 5.575 0 C 6.33 0 7.053 0.147 7.742 0.441 C 8.432 0.735 9.026 1.131 9.523 1.628 C 10.02 2.125 10.416 2.719 10.71 3.409 C 11.004 4.098 11.151 4.821 11.151 5.575 C 11.151 6.351 11 7.085 10.698 7.777 C 10.396 8.47 9.977 9.074 9.441 9.589 L 9.441 9.589 Z M 5.575 10.495 C 6.466 10.495 7.288 10.275 8.043 9.835 C 8.798 9.395 9.395 8.798 9.835 8.043 C 10.275 7.288 10.495 6.466 10.495 5.575 C 10.495 4.685 10.275 3.863 9.835 3.108 C 9.395 2.353 8.798 1.756 8.043 1.316 C 7.288 0.876 6.466 0.656 5.575 0.656 C 4.685 0.656 3.863 0.876 3.108 1.316 C 2.353 1.756 1.756 2.353 1.316 3.108 C 0.876 3.863 0.656 4.685 0.656 5.575 C 0.656 6.466 0.876 7.288 1.316 8.043 C 1.756 8.798 2.353 9.395 3.108 9.835 C 3.863 10.275 4.685 10.495 5.575 10.495 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 0.838 0)\"/>"
    },
    "SearchSolid": {
      viewBox: "0 0 16.670 16.670",
      body: "<path d=\"M 11.84 11.458 L 15.398 15.628 L 14.174 16.67 L 10.626 12.51 C 9.478 13.275 8.212 13.657 6.829 13.657 C 5.904 13.657 5.019 13.477 4.175 13.117 C 3.33 12.757 2.603 12.272 1.994 11.663 C 1.385 11.054 0.901 10.327 0.54 9.483 C 0.18 8.638 0 7.753 0 6.829 C 0 5.904 0.18 5.019 0.54 4.175 C 0.901 3.33 1.385 2.603 1.994 1.994 C 2.603 1.385 3.33 0.901 4.175 0.54 C 5.02 0.18 5.904 0 6.829 0 C 7.753 0 8.638 0.18 9.483 0.54 C 10.328 0.901 11.054 1.385 11.663 1.994 C 12.272 2.603 12.757 3.33 13.117 4.175 C 13.477 5.019 13.657 5.904 13.657 6.829 C 13.657 7.415 13.584 7.989 13.437 8.55 C 13.291 9.111 13.082 9.634 12.811 10.119 C 12.54 10.603 12.216 11.05 11.84 11.458 L 11.84 11.458 Z M 6.829 12.051 C 7.536 12.051 8.212 11.912 8.856 11.634 C 9.5 11.357 10.055 10.986 10.52 10.52 C 10.986 10.055 11.357 9.5 11.635 8.856 C 11.912 8.212 12.051 7.536 12.051 6.829 C 12.051 6.121 11.912 5.445 11.635 4.801 C 11.357 4.157 10.986 3.602 10.52 3.137 C 10.055 2.671 9.5 2.3 8.856 2.023 C 8.212 1.745 7.536 1.607 6.829 1.607 C 6.121 1.607 5.445 1.745 4.801 2.023 C 4.157 2.3 3.602 2.671 3.137 3.137 C 2.672 3.602 2.3 4.157 2.023 4.801 C 1.745 5.445 1.607 6.121 1.607 6.829 C 1.607 7.536 1.745 8.212 2.023 8.856 C 2.3 9.5 2.672 10.055 3.137 10.52 C 3.603 10.986 4.157 11.357 4.801 11.634 C 5.445 11.912 6.121 12.05 6.829 12.051 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 1.042 0.000)\"/>"
    },
    "Share": {
      viewBox: "0 0 13.950 19.481",
      body: "<path d=\"M 7.44 1.871 L 9.701 4.65 L 10.23 4 L 6.975 0 L 3.72 4 L 4.249 4.65 L 6.51 1.871 L 6.51 13.02 L 7.44 13.02 L 7.44 1.871 Z M 11.013 6.999 L 11.013 7.328 L 11.013 7.656 L 13.216 7.656 L 13.216 18.824 L 0.734 18.824 L 0.734 7.656 L 2.937 7.656 L 2.937 6.999 L 0 6.999 L 0 19.481 L 13.95 19.481 L 13.95 6.999 L 11.013 6.999 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"matrix(1 0 0 1 0 0)\"/>"
    },
    "Shuffle": {
      viewBox: "0 0 16 16",
      body: "<path d=\"M 3.452 3.627 L 4.123 2.864 C 3.068 1.623 1.534 0.955 0 0.955 L 0 1.909 C 1.247 1.909 2.493 2.482 3.356 3.436 L 3.452 3.627 Z M 10.644 8.114 C 9.493 8.114 8.438 7.636 7.575 6.873 L 7 7.636 C 7.959 8.591 9.301 9.068 10.644 9.068 L 10.644 10.5 L 14 8.591 L 10.644 6.682 L 10.644 8.114 Z M 10.644 2.386 L 10.644 3.818 L 14 1.909 L 10.644 0 L 10.644 1.432 C 9.11 1.432 7.575 2.1 6.616 3.341 L 3.356 7.064 C 2.493 8.018 1.247 8.591 0 8.591 L 0 9.545 C 1.534 9.545 3.068 8.877 4.027 7.636 L 7.288 3.914 C 8.151 2.959 9.397 2.386 10.644 2.386 Z\" fill=\"currentColor\" fill-rule=\"nonzero\" transform=\"matrix(1 0 0 1 1 3)\"/>"
    },
    "Vector": {
      viewBox: "0 0 15.867 17.733",
      body: "<path d=\"M 7.933 17.733 C 8.534 17.733 9.111 17.5 9.536 17.084 C 9.961 16.668 10.2 16.105 10.2 15.517 L 5.667 15.517 C 5.667 16.105 5.905 16.668 6.331 17.084 C 6.756 17.5 7.332 17.733 7.933 17.733 Z M 7.933 2.127 L 7.03 2.305 C 6.005 2.509 5.085 3.053 4.423 3.845 C 3.762 4.637 3.4 5.628 3.4 6.651 C 3.4 7.347 3.248 9.085 2.88 10.798 C 2.698 11.648 2.454 12.533 2.128 13.3 L 13.738 13.3 C 13.413 12.533 13.169 11.649 12.987 10.798 C 12.619 9.085 12.467 7.347 12.467 6.651 C 12.466 5.628 12.105 4.637 11.443 3.846 C 10.782 3.054 9.861 2.51 8.837 2.306 L 7.933 2.126 L 7.933 2.127 Z M 14.983 13.3 C 15.235 13.796 15.528 14.188 15.867 14.409 L 0 14.409 C 0.339 14.188 0.631 13.796 0.884 13.3 C 1.904 11.305 2.267 7.626 2.267 6.651 C 2.267 3.969 4.216 1.73 6.806 1.219 C 6.79 1.065 6.807 0.909 6.857 0.762 C 6.906 0.615 6.987 0.48 7.093 0.365 C 7.199 0.25 7.329 0.158 7.474 0.095 C 7.618 0.032 7.775 0 7.933 0 C 8.092 0 8.248 0.032 8.393 0.095 C 8.538 0.158 8.668 0.25 8.774 0.365 C 8.88 0.48 8.96 0.615 9.01 0.762 C 9.059 0.909 9.077 1.065 9.061 1.219 C 10.342 1.474 11.494 2.154 12.321 3.143 C 13.148 4.133 13.6 5.372 13.6 6.651 C 13.6 7.626 13.963 11.305 14.983 13.3 Z\" fill=\"currentColor\" fill-rule=\"nonzero\"/>"
    }
  };
} catch {}
Object.assign(__ds_scope, { __ds_default_components_icons_icon_data_12stud1 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/icon-data.js", error: String((e && e.message) || e) }); }

__ds_scope.__ds_default_components_icons_icon_data_12stud1$1nb03e1 = __ds_scope.__ds_default_components_icons_icon_data_12stud1;

// components/icons/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Icon({
  name,
  size,
  ...rest
}) {
  const d = __ds_scope.__ds_default_components_icons_icon_data_12stud1$1nb03e1[name];
  if (!d) return null;
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: d.viewBox,
    fill: "none"
    // body strings are emitter-controlled <path> markup — geometry,
    // numeric fills and transforms only; no .fig-authored text reaches them.
    ,
    dangerouslySetInnerHTML: {
      __html: d.body
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon, __ds_default_components_icons_Icon_fio49a: Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/controls/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IconButton — a bare transport / action icon (heart, shuffle, repeat,
 * share, more…) rendered from the kit's icon set. Ghost by default;
 * `filled` wraps it in a solid circle (e.g. the small green download button).
 */
function IconButton({
  name,
  size = 24,
  color = 'var(--text-white, #fff)',
  active = false,
  filled = false,
  circleColor = 'var(--green-logo, #57B65F)',
  label,
  onClick,
  style,
  ...rest
}) {
  const glyph = filled ? Math.round(size * 0.62) : size;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    "aria-label": label || name,
    "aria-pressed": active,
    style: {
      width: filled ? size : 'auto',
      height: filled ? size : 'auto',
      padding: filled ? 0 : 2,
      border: 'none',
      borderRadius: filled ? '50%' : 4,
      background: filled ? circleColor : 'transparent',
      color: active ? 'var(--green-bright, #1ED760)' : color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      opacity: 1,
      transition: 'opacity .1s ease, color .1s ease',
      ...style
    },
    onMouseEnter: e => {
      if (!active) e.currentTarget.style.opacity = '0.7';
    },
    onMouseLeave: e => {
      e.currentTarget.style.opacity = '1';
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: name,
    size: glyph,
    style: {
      color: filled ? 'var(--text-black, #191414)' : 'inherit',
      display: 'block'
    }
  }));
}
Object.assign(__ds_scope, { IconButton, __ds_default_components_controls_IconButton_qmos3m: IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/controls/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/inputs/SearchField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SearchField — the search input. `variant="hero"` is the white pill on the
 * Search landing page; `variant="dark"` is the grey inline field used inside
 * playlists ("Find in playlist").
 */
function SearchField({
  placeholder = 'Artists, songs, or podcasts',
  variant = 'hero',
  value,
  onChange,
  style,
  ...rest
}) {
  const hero = variant === 'hero';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      borderRadius: hero ? 4 : 6,
      background: hero ? 'var(--text-white, #fff)' : 'var(--surface-2, #282828)',
      padding: hero ? '12px 14px' : '9px 12px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "SearchSolid",
    size: hero ? 22 : 15,
    style: {
      color: hero ? 'var(--black,#000)' : 'var(--text-white,#fff)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontWeight: hero ? 500 : 600,
      fontSize: hero ? 15 : 14,
      color: hero ? 'var(--black,#000)' : 'var(--text-white,#fff)'
    }
  }));
}
Object.assign(__ds_scope, { SearchField, __ds_default_components_inputs_SearchField_1gm5dpi: SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/kit/ArrowNarrowDown1.jsx
try { (() => {
// figma node: 93:2670 arrow-narrow-down 1
function ArrowNarrowDown1(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 24,
      height: 24,
      overflow: "hidden",
      position: "relative",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 24,
      height: 24
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 24 0 L 24 24 L 0 24 L 0 0 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 2,
    height: 14,
    viewBox: "-1 0 2 14",
    fill: "none",
    style: {
      position: "absolute",
      left: 12,
      top: 5,
      width: 2,
      height: 14,
      color: "rgb(0,0,0)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 1 0 C 1 -0.552 0.552 -1 0 -1 C -0.552 -1 -1 -0.552 -1 0 L 1 0 Z M -1 14 C -1 14.552 -0.552 15 0 15 C 0.552 15 1 14.552 1 14 L -1 14 Z M -1 0 L -1 14 L 1 14 L 1 0 L -1 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 4,
    height: 4,
    viewBox: "0 0 4 4",
    fill: "none",
    style: {
      position: "absolute",
      left: 12,
      top: 15,
      width: 4,
      height: 4,
      color: "rgb(0,0,0)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 4.707 0.707 C 5.098 0.317 5.098 -0.317 4.707 -0.707 C 4.317 -1.098 3.683 -1.098 3.293 -0.707 L 4.707 0.707 Z M -0.707 3.293 C -1.098 3.683 -1.098 4.317 -0.707 4.707 C -0.317 5.098 0.317 5.098 0.707 4.707 L -0.707 3.293 Z M 3.293 -0.707 L -0.707 3.293 L 0.707 4.707 L 4.707 0.707 L 3.293 -0.707 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 4,
    height: 4,
    viewBox: "0 0 4 4",
    fill: "none",
    style: {
      position: "absolute",
      left: 8,
      top: 15,
      width: 4,
      height: 4,
      color: "rgb(0,0,0)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0.707 -0.707 C 0.317 -1.098 -0.317 -1.098 -0.707 -0.707 C -1.098 -0.317 -1.098 0.317 -0.707 0.707 L 0.707 -0.707 Z M 3.293 4.707 C 3.683 5.098 4.317 5.098 4.707 4.707 C 5.098 4.317 5.098 3.683 4.707 3.293 L 3.293 4.707 Z M -0.707 0.707 L 3.293 4.707 L 4.707 3.293 L 0.707 -0.707 L -0.707 0.707 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { ArrowNarrowDown1, __ds_default_components_kit_ArrowNarrowDown1_islv32: ArrowNarrowDown1 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/ArrowNarrowDown1.jsx", error: String((e && e.message) || e) }); }

// components/kit/ButtonM.jsx
try { (() => {
// figma node: 93:2675 Button/M
function ButtonM(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 21,
      height: 21,
      position: "relative",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 21,
      height: 21,
      borderRadius: "50%",
      backgroundColor: "rgb(87,182,95)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 3.5,
      top: 3.5,
      width: 14,
      height: 14
    }
  }, props.icon1 ?? /*#__PURE__*/React.createElement(__ds_scope.ArrowNarrowDown1, {
    style: {
      transform: "scale(0.583, 0.583)",
      transformOrigin: "0 0"
    }
  })));
}
Object.assign(__ds_scope, { ButtonM, __ds_default_components_kit_ButtonM_s4g0ca: ButtonM });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/ButtonM.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component17.jsx
try { (() => {
// figma node: 158:1721 Component 17
function Component17(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 15,
      height: 16.21,
      position: "relative",
      color: "rgb(251,251,251)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 7.198,
    height: 1.200,
    viewBox: "0 -0.600 7.198 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0,1,-1,0,9,9)",
      transformOrigin: "0 0",
      width: 7.198,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0.6 L 7.198 0.6 L 7.198 -0.6 L 0 -0.6 L 0 0.6 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 7.198,
    height: 1.200,
    viewBox: "0 -0.600 7.198 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0,1,-1,0,0,9)",
      transformOrigin: "0 0",
      width: 7.198,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0.6 L 7.198 0.6 L 7.198 -0.6 L 0 -0.6 L 0 0.6 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 7.198,
    height: 1.200,
    viewBox: "0 -0.600 7.198 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0,1,-1,0,9,0)",
      transformOrigin: "0 0",
      width: 7.198,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0.6 L 7.198 0.6 L 7.198 -0.6 L 0 -0.6 L 0 0.6 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 7.210,
    height: 0,
    viewBox: "0 0 7.210 0",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0,1,-1,0,5.600,0)",
      transformOrigin: "0 0",
      width: 7.21,
      height: 0.00009763240814208984
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0.6 L 7.21 0.6 L 7.21 -0.6 L 0 -0.6 L 0 0.6 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 7.210,
    height: 0,
    viewBox: "0 0 7.210 0",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0,1,-1,0,14.600,9)",
      transformOrigin: "0 0",
      width: 7.21,
      height: 0.00009763240814208984
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0.6 L 7.21 0.6 L 7.21 -0.6 L 0 -0.6 L 0 0.6 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 7.210,
    height: 0,
    viewBox: "0 0 7.210 0",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0,1,-1,0,5.600,9)",
      transformOrigin: "0 0",
      width: 7.21,
      height: 0.00009763240814208984
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0.6 L 7.21 0.6 L 7.21 -0.6 L 0 -0.6 L 0 0.6 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 7.210,
    height: 0,
    viewBox: "0 0 7.210 0",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0,1,-1,0,14.600,0)",
      transformOrigin: "0 0",
      width: 7.21,
      height: 0.00009763240814208984
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0.6 L 7.21 0.6 L 7.21 -0.6 L 0 -0.6 L 0 0.6 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 6,
    height: 1.200,
    viewBox: "0 -0.600 6 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,-1,6,0)",
      transformOrigin: "0 0",
      width: 6,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 6 0 L 6 -1.2 L 0 -1.2 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 6,
    height: 1.200,
    viewBox: "0 -0.600 6 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,-1,15,9)",
      transformOrigin: "0 0",
      width: 6,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 6 0 L 6 -1.2 L 0 -1.2 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 6,
    height: 1.200,
    viewBox: "0 -0.600 6 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,-1,6,9)",
      transformOrigin: "0 0",
      width: 6,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 6 0 L 6 -1.2 L 0 -1.2 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 7.198,
    height: 1.200,
    viewBox: "0 -0.600 7.198 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0,1,-1,0,0,0)",
      transformOrigin: "0 0",
      width: 7.198,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0.6 L 7.198 0.6 L 7.198 -0.6 L 0 -0.6 L 0 0.6 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 6,
    height: 1.200,
    viewBox: "0 -0.600 6 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,-1,15,0)",
      transformOrigin: "0 0",
      width: 6,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 6 0 L 6 -1.2 L 0 -1.2 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 6,
    height: 1.200,
    viewBox: "0 -0.600 6 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,-1,6,6)",
      transformOrigin: "0 0",
      width: 6,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 6 0 L 6 -1.2 L 0 -1.2 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 6,
    height: 1.200,
    viewBox: "0 -0.600 6 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,-1,15,15)",
      transformOrigin: "0 0",
      width: 6,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 6 0 L 6 -1.2 L 0 -1.2 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 6,
    height: 1.200,
    viewBox: "0 -0.600 6 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,-1,6,15)",
      transformOrigin: "0 0",
      width: 6,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 6 0 L 6 -1.2 L 0 -1.2 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 6,
    height: 1.200,
    viewBox: "0 -0.600 6 1.200",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,-1,15,6)",
      transformOrigin: "0 0",
      width: 6,
      height: 1.2000000476837158
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 6 0 L 6 -1.2 L 0 -1.2 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { Component17, __ds_default_components_kit_Component17_138dh7w: Component17 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component17.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component18.jsx
try { (() => {
// figma node: 158:1745 Component 18
function Component18(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 19,
      height: 15.854,
      position: "relative",
      color: "rgb(179,179,179)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 3,
      top: 0,
      width: 16,
      height: 1.5,
      backgroundColor: "rgb(196,196,196)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 11,
      top: 11,
      width: 8,
      height: 1,
      backgroundColor: "rgb(196,196,196)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0.005,1,-1,0.005,18.943,0)",
      transformOrigin: "0 0",
      width: 11.984,
      height: 1.591,
      backgroundColor: "rgb(196,196,196)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0.005,1,-1,0.005,4.602,0)",
      transformOrigin: "0 0",
      width: 4.604,
      height: 1.61,
      backgroundColor: "rgb(196,196,196)"
    }
  }), /*#__PURE__*/React.createElement("svg", {
    width: 9.565,
    height: 7.171,
    viewBox: "0 0 9.565 7.171",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0.727,0.686,-0.686,0.727,4.921,4.074)",
      transformOrigin: "0 0",
      width: 9.565,
      height: 7.171
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 9.434 2.233 C 9.627 2.021 9.607 1.665 9.378 1.501 C 8.011 0.518 6.414 -0.003 4.783 0 C 3.089 0 1.51 0.551 0.188 1.501 C 0.135 1.54 0.091 1.592 0.059 1.653 C 0.026 1.714 0.007 1.782 0.002 1.852 C -0.004 1.922 0.005 1.993 0.028 2.059 C 0.05 2.125 0.086 2.184 0.132 2.233 C 0.208 2.315 0.307 2.366 0.412 2.377 C 0.517 2.389 0.623 2.361 0.712 2.297 C 1.927 1.437 3.34 0.981 4.783 0.983 C 6.226 0.981 7.639 1.437 8.854 2.297 C 9.037 2.427 9.281 2.403 9.434 2.233 Z M 7.493 4.38 C 7.694 4.157 7.657 3.785 7.404 3.642 C 6.592 3.186 5.694 2.948 4.783 2.95 C 3.84 2.95 2.949 3.2 2.163 3.642 C 1.909 3.785 1.873 4.157 2.074 4.38 L 2.087 4.394 C 2.23 4.552 2.45 4.581 2.631 4.483 C 3.301 4.12 4.037 3.932 4.783 3.933 C 5.555 3.933 6.287 4.131 6.936 4.484 C 7.116 4.582 7.336 4.553 7.479 4.394 L 7.493 4.38 Z M 5.726 6.332 C 5.9 6.14 5.902 5.821 5.691 5.683 C 5.416 5.503 5.103 5.408 4.783 5.408 C 4.464 5.408 4.15 5.503 3.876 5.683 C 3.664 5.821 3.666 6.14 3.84 6.332 L 4.468 7.027 C 4.51 7.072 4.559 7.109 4.613 7.133 C 4.667 7.158 4.725 7.171 4.783 7.171 C 4.842 7.171 4.9 7.158 4.954 7.133 C 5.008 7.109 5.057 7.072 5.098 7.027 L 5.726 6.332 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { Component18, __ds_default_components_kit_Component18_138dh7x: Component18 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component18.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component19.jsx
try { (() => {
// figma node: 158:1842 Component 19
function Component19(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 15,
      height: 15.023,
      position: "relative",
      color: "rgb(251,251,251)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 20.326,
    height: 1,
    viewBox: "0 -0.500 20.326 1",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0.738,0.675,-0.675,0.738,0,1.307)",
      transformOrigin: "0 0",
      width: 20.326,
      height: 1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 20.326 0 L 20.326 -1 L 0 -1 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 20.556,
    height: 1,
    viewBox: "0 -0.500 20.556 1",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-0.714,0.701,-0.701,-0.714,14.668,0)",
      transformOrigin: "0 0",
      width: 20.556,
      height: 1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 20.556 0 L 20.556 -1 L 0 -1 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { Component19, __ds_default_components_kit_Component19_138dh7y: Component19 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component19.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component20.jsx
try { (() => {
// figma node: 158:2107 Component 20
function Component20(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 20,
      height: 20,
      position: "relative",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 20,
      height: 20,
      borderRadius: "50%",
      backgroundColor: "rgb(114,114,114)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 1,
      top: 1,
      width: 18,
      height: 18,
      borderRadius: "50%",
      backgroundColor: "rgb(27,24,24)"
    }
  }));
}
Object.assign(__ds_scope, { Component20, __ds_default_components_kit_Component20_138dh8m: Component20 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component20.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component27.jsx
try { (() => {
// figma node: 168:1906 Component 27
function Component27(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 18,
      height: 16,
      position: "relative",
      color: "rgb(255,255,255)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 5,
    height: 6,
    viewBox: "0 0 5 6",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 5,
      height: 6
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 6 L 5 3 L 0 0 L 0 6 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 8,
      top: 3,
      width: 10,
      height: 1,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 15,
      width: 18,
      height: 1,
      backgroundColor: "rgb(255,255,255)"
    }
  }));
}
Object.assign(__ds_scope, { Component27, __ds_default_components_kit_Component27_138dh8t: Component27 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component27.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component28.jsx
try { (() => {
// figma node: 168:1907 Component 28
function Component28(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 14,
      height: 19.8,
      position: "relative",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 5,
      height: 19.8,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 9,
      top: 0,
      width: 5,
      height: 19.8,
      backgroundColor: "rgb(255,255,255)"
    }
  }));
}
Object.assign(__ds_scope, { Component28, __ds_default_components_kit_Component28_138dh8u: Component28 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component28.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component29.jsx
try { (() => {
// figma node: 168:1908 Component 29
function Component29(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 13,
      height: 13.02,
      position: "relative",
      color: "rgb(251,251,251)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 17.615,
    height: 1,
    viewBox: "0 -0.500 17.615 1",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0.738,0.675,-0.675,0.738,0,1.132)",
      transformOrigin: "0 0",
      width: 17.615,
      height: 1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 17.615 0 L 17.615 -1 L 0 -1 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 17.815,
    height: 1,
    viewBox: "0 -0.500 17.815 1",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-0.714,0.701,-0.701,-0.714,12.711,0)",
      transformOrigin: "0 0",
      width: 17.815,
      height: 1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 17.815 0 L 17.815 -1 L 0 -1 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { Component29, __ds_default_components_kit_Component29_138dh8v: Component29 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component29.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component30.jsx
try { (() => {
// figma node: 168:1909 Component 30
function Component30(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 75,
      height: 39,
      position: "relative",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 36,
      top: 0,
      width: 2,
      height: 39,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 29,
      top: 2,
      width: 2,
      height: 37,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,1,45,2)",
      transformOrigin: "0 0",
      width: 2,
      height: 37,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 22,
      top: 9,
      width: 2,
      height: 30,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,1,52,9)",
      transformOrigin: "0 0",
      width: 2,
      height: 30,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 15,
      top: 17,
      width: 2,
      height: 22,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,1,59,17)",
      transformOrigin: "0 0",
      width: 2,
      height: 22,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 7,
      top: 22,
      width: 2,
      height: 17,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,1,67,22)",
      transformOrigin: "0 0",
      width: 2,
      height: 17,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 26,
      width: 2,
      height: 13,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(-1,0,0,1,75,26)",
      transformOrigin: "0 0",
      width: 2,
      height: 13,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)"
    }
  }));
}
Object.assign(__ds_scope, { Component30, __ds_default_components_kit_Component30_138dh9j: Component30 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component30.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component31.jsx
try { (() => {
// figma node: 168:1910 Component 31
function Component31(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 29,
      height: 22,
      position: "relative",
      color: "rgb(255,255,255)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 29,
    height: 22,
    viewBox: "0 0 29 22",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 29,
      height: 22
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 27.188 18.333 C 27.188 18.82 26.997 19.286 26.657 19.63 C 26.317 19.974 25.856 20.167 25.375 20.167 L 3.625 20.167 C 3.144 20.167 2.683 19.974 2.343 19.63 C 2.003 19.286 1.813 18.82 1.813 18.333 L 1.813 7.333 C 1.813 6.847 2.003 6.381 2.343 6.037 C 2.683 5.693 3.144 5.5 3.625 5.5 L 5.749 5.5 C 7.191 5.499 8.573 4.92 9.592 3.888 L 11.096 2.371 C 11.435 2.028 11.895 1.834 12.374 1.833 L 16.622 1.833 C 17.103 1.833 17.564 2.027 17.904 2.371 L 19.405 3.888 C 19.91 4.399 20.509 4.805 21.169 5.081 C 21.829 5.358 22.536 5.5 23.251 5.5 L 25.375 5.5 C 25.856 5.5 26.317 5.693 26.657 6.037 C 26.997 6.381 27.188 6.847 27.188 7.333 L 27.188 18.333 Z M 3.625 3.667 C 2.664 3.667 1.742 4.053 1.062 4.741 C 0.382 5.428 0 6.361 0 7.333 L 0 18.333 C 0 19.306 0.382 20.238 1.062 20.926 C 1.742 21.614 2.664 22 3.625 22 L 25.375 22 C 26.336 22 27.258 21.614 27.938 20.926 C 28.618 20.238 29 19.306 29 18.333 L 29 7.333 C 29 6.361 28.618 5.428 27.938 4.741 C 27.258 4.053 26.336 3.667 25.375 3.667 L 23.251 3.667 C 22.289 3.666 21.368 3.28 20.688 2.592 L 19.187 1.074 C 18.507 0.387 17.586 0 16.624 0 L 12.376 0 C 11.414 0 10.493 0.387 9.813 1.074 L 8.312 2.592 C 7.632 3.28 6.711 3.666 5.749 3.667 L 3.625 3.667 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 13,
    height: 13,
    viewBox: "0 0 13 13",
    fill: "none",
    style: {
      position: "absolute",
      left: 8,
      top: 5,
      width: 13,
      height: 13
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 6.5 11.143 C 5.269 11.143 4.088 10.654 3.217 9.783 C 2.346 8.912 1.857 7.731 1.857 6.5 C 1.857 5.269 2.346 4.088 3.217 3.217 C 4.088 2.346 5.269 1.857 6.5 1.857 C 7.731 1.857 8.912 2.346 9.783 3.217 C 10.654 4.088 11.143 5.269 11.143 6.5 C 11.143 7.731 10.654 8.912 9.783 9.783 C 8.912 10.654 7.731 11.143 6.5 11.143 Z M 6.5 13 C 8.224 13 9.877 12.315 11.096 11.096 C 12.315 9.877 13 8.224 13 6.5 C 13 4.776 12.315 3.123 11.096 1.904 C 9.877 0.685 8.224 0 6.5 0 C 4.776 0 3.123 0.685 1.904 1.904 C 0.685 3.123 0 4.776 0 6.5 C 0 8.224 0.685 9.877 1.904 11.096 C 3.123 12.315 4.776 13 6.5 13 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { Component31, __ds_default_components_kit_Component31_138dh9k: Component31 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component31.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component32.jsx
try { (() => {
// figma node: 168:1941 Component 32
function Component32(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 19.219,
      height: 23.6,
      position: "relative",
      color: "rgb(196,196,196)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 1,
    height: 9,
    viewBox: "0 0 1 9",
    fill: "none",
    style: {
      position: "absolute",
      left: 6,
      top: 10.6,
      width: 1,
      height: 9
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 1 0 L 1 9 L 0 8.4 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 10.703,
    height: 1.291,
    viewBox: "0 0 10.703 1.291",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0.974,-0.225,0.225,0.974,8.500,6.100)",
      transformOrigin: "0 0",
      width: 10.703,
      height: 1.291
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0 L 10.703 0.317 L 10.478 1.291 L 0.262 1.087 L 0 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 2.6,
      width: 10,
      height: 10,
      borderRadius: "50%",
      backgroundColor: "rgb(179,179,179)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 1.5,
      top: 0.8,
      width: 8,
      height: 11,
      fontFamily: "Roboto, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
      fontWeight: 400,
      fontSize: 12.300000190734863,
      whiteSpace: "nowrap",
      lineHeight: "100%",
      color: "rgb(31,25,25)"
    }
  }, props.text1 ?? "+"), /*#__PURE__*/React.createElement("svg", {
    width: 7,
    height: 7,
    viewBox: "0 0 7 7",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 16.6,
      width: 7,
      height: 7
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 3.5 7 C 5.433 7 7 5.433 7 3.5 C 7 1.567 5.433 0 3.5 0 C 1.567 0 0 1.567 0 3.5 C 0 5.433 1.567 7 3.5 7 Z M 3.5 5.833 C 4.789 5.833 5.833 4.789 5.833 3.5 C 5.833 2.211 4.789 1.167 3.5 1.167 C 2.211 1.167 1.167 2.211 1.167 3.5 C 1.167 4.789 2.211 5.833 3.5 5.833 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 7,
    height: 7,
    viewBox: "0 0 7 7",
    fill: "none",
    style: {
      position: "absolute",
      left: 12,
      top: 14.6,
      width: 7,
      height: 7
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 3.5 7 C 5.433 7 7 5.433 7 3.5 C 7 1.567 5.433 0 3.5 0 C 1.567 0 0 1.567 0 3.5 C 0 5.433 1.567 7 3.5 7 Z M 3.5 5.833 C 4.789 5.833 5.833 4.789 5.833 3.5 C 5.833 2.211 4.789 1.167 3.5 1.167 C 2.211 1.167 1.167 2.211 1.167 3.5 C 1.167 4.789 2.211 5.833 3.5 5.833 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 1,
    height: 13,
    viewBox: "0 0 1 13",
    fill: "none",
    style: {
      position: "absolute",
      left: 18,
      top: 4.6,
      width: 1,
      height: 13
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 0.464 L 1 0 L 1 13 L 0 12.072 L 0 0.464 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { Component32, __ds_default_components_kit_Component32_138dh9l: Component32 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component32.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component33.jsx
try { (() => {
// figma node: 168:1942 Component 33
function Component33(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 20,
      height: 21.5,
      position: "relative",
      color: "rgb(179,179,179)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 13,
      top: 6.5,
      width: 7,
      height: 1,
      backgroundColor: "rgb(179,179,179)"
    }
  }), /*#__PURE__*/React.createElement("svg", {
    width: 12,
    height: 1,
    viewBox: "0 0 12 1",
    fill: "none",
    style: {
      position: "absolute",
      left: 8,
      top: 13.5,
      width: 12,
      height: 1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 1.385 0 L 12 0 L 12 1 L 0 1 L 1.385 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 3,
      top: 20.5,
      width: 17,
      height: 1,
      backgroundColor: "rgb(179,179,179)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 1,
      top: 3.3,
      width: 10,
      height: 10,
      borderRadius: "50%",
      backgroundColor: "rgb(179,179,179)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 2.5,
      top: 1.5,
      width: 8,
      height: 11,
      fontFamily: "Roboto, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
      fontWeight: 400,
      fontSize: 12.300000190734863,
      whiteSpace: "nowrap",
      lineHeight: "100%",
      color: "rgb(31,25,25)"
    }
  }, props.text1 ?? "+"));
}
Object.assign(__ds_scope, { Component33, __ds_default_components_kit_Component33_138dh9m: Component33 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component33.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component34.jsx
try { (() => {
// figma node: 168:2099 Component 34
function Component34(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 59,
      height: 59,
      position: "relative",
      color: "rgb(25,20,20)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 59,
      height: 59,
      borderRadius: "50%",
      backgroundColor: "rgb(255,255,255)"
    }
  }), /*#__PURE__*/React.createElement("svg", {
    width: 19,
    height: 23,
    viewBox: "0 0 19 23",
    fill: "none",
    style: {
      position: "absolute",
      left: 22,
      top: 18,
      width: 19,
      height: 23
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 23 L 19 11.5 L 0 0 L 0 23 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { Component34, __ds_default_components_kit_Component34_138dh9n: Component34 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component34.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component35.jsx
try { (() => {
// figma node: 168:2100 Component 35
function Component35(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 56,
      height: 56,
      position: "relative",
      color: "rgb(0,0,0)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 56,
      height: 56,
      borderRadius: "50%",
      backgroundColor: "rgb(30,215,96)"
    }
  }), /*#__PURE__*/React.createElement("svg", {
    width: 20,
    height: 22,
    viewBox: "0 0 20 22",
    fill: "none",
    style: {
      position: "absolute",
      left: 21,
      top: 17,
      width: 20,
      height: 22,
      borderRadius: 0.5
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 19.203 10.562 C 19.549 10.752 19.549 11.248 19.203 11.438 L 0.741 21.592 C 0.408 21.776 0 21.535 0 21.154 L 0 0.846 C 0 0.465 0.408 0.224 0.741 0.408 L 19.203 10.562 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })));
}
Object.assign(__ds_scope, { Component35, __ds_default_components_kit_Component35_138dh9o: Component35 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component35.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component36.jsx
try { (() => {
// figma node: 168:2101 Component 36
function Component36(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 30,
      height: 28,
      position: "relative",
      color: "rgb(178,178,178)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 30,
    height: 22,
    viewBox: "0 0 30 22",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 30,
      height: 22
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 2.285 21.885 L 27.656 22 C 28.913 22 30 20.901 30 19.697 L 30 2.581 C 30 1.378 29.382 0.337 28.125 0.337 L 2.285 0 C 1.028 0 0 0.985 0 2.189 L 0 19.697 C 0 20.901 1.028 21.885 2.285 21.885 Z M 2.285 2.189 L 27.656 2.245 L 27.656 19.697 L 2.285 19.697 L 2.285 2.189 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 12,
    height: 2,
    viewBox: "0 0 12 2",
    fill: "none",
    style: {
      position: "absolute",
      left: 9,
      top: 26,
      width: 12,
      height: 2,
      borderRadius: 21
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 1 C 0 0.448 0.448 0 1 0 L 11 0 C 11.552 0 12 0.448 12 1 L 12 1 C 12 1.552 11.552 2 11 2 L 1 2 C 0.448 2 0 1.552 0 1 L 0 1 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { Component36, __ds_default_components_kit_Component36_138dh9p: Component36 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component36.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component37.jsx
try { (() => {
// figma node: 168:2102 Component 37
function Component37(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 18,
      height: 18,
      position: "relative",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 9,
    height: 8,
    viewBox: "0 0 9 8",
    fill: "none",
    style: {
      position: "absolute",
      left: 9,
      top: 8,
      width: 9,
      height: 8,
      color: "rgb(66,133,244)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 9 1.742 C 9 1.138 8.94 0.557 8.83 0 L 0 0 L 0 3.294 L 5.045 3.294 C 4.828 4.358 4.168 5.26 3.175 5.864 L 3.175 8 L 6.205 8 C 7.977 6.518 9 4.335 9 1.742 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 14,
    height: 7,
    viewBox: "0 0 14 7",
    fill: "none",
    style: {
      position: "absolute",
      left: 1,
      top: 11,
      width: 14,
      height: 7,
      color: "rgb(52,168,83)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 8.043 7 C 10.473 7 12.511 6.226 14 4.906 L 11.091 2.738 C 10.285 3.256 9.254 3.563 8.043 3.563 C 5.699 3.563 3.715 2.043 3.007 0 L 0 0 L 0 2.239 C 1.481 5.063 4.525 7 8.043 7 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 4,
    height: 8,
    viewBox: "0 0 4 8",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 5,
      width: 4,
      height: 8,
      color: "rgb(251,188,5)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 4 5.692 C 3.818 5.158 3.715 4.587 3.715 4 C 3.715 3.413 3.818 2.842 4 2.308 L 4 0 L 0.966 0 C 0.351 1.202 0 2.563 0 4 C 0 5.437 0.351 6.798 0.966 8 L 4 5.692 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })), /*#__PURE__*/React.createElement("svg", {
    width: 14,
    height: 7,
    viewBox: "0 0 14 7",
    fill: "none",
    style: {
      position: "absolute",
      left: 1,
      top: 0,
      width: 14,
      height: 7,
      color: "rgb(234,67,53)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 8.006 3.437 C 9.321 3.437 10.502 3.873 11.43 4.73 L 14 2.251 C 12.449 0.856 10.421 0 8.006 0 C 4.504 0 1.474 1.937 0 4.761 L 2.993 7 C 3.697 4.957 5.672 3.437 8.006 3.437 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })));
}
Object.assign(__ds_scope, { Component37, __ds_default_components_kit_Component37_138dh9q: Component37 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component37.jsx", error: String((e && e.message) || e) }); }

// components/kit/Component9.jsx
try { (() => {
// figma node: 157:2023 Component 9
function Component9(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 20,
      height: 10,
      position: "relative",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 20,
      height: 2,
      borderRadius: 3,
      backgroundColor: "rgb(71,70,75)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 4,
      width: 20,
      height: 2,
      borderRadius: 3,
      backgroundColor: "rgb(71,70,75)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 8,
      width: 20,
      height: 2,
      borderRadius: 3,
      backgroundColor: "rgb(71,70,75)"
    }
  }));
}
Object.assign(__ds_scope, { Component9, __ds_default_components_kit_Component9_iepe3h: Component9 });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Component9.jsx", error: String((e && e.message) || e) }); }

// components/kit/CoverDisc.jsx
try { (() => {
// figma node: 137:1569 Cover Disc
function CoverDisc(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 168,
      height: 168,
      position: "relative",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 168,
      height: 168
    }
  }));
}
Object.assign(__ds_scope, { CoverDisc, __ds_default_components_kit_CoverDisc_13bykmr: CoverDisc });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/CoverDisc.jsx", error: String((e && e.message) || e) }); }

// components/kit/LibrarySmall.jsx
try { (() => {
// figma node: 1:363 Library small
function LibrarySmall(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 22,
      height: 22,
      overflow: "hidden",
      position: "relative",
      color: "rgb(119,119,119)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 20.900,
    height: 20.401,
    viewBox: "0 0 20.900 20.401",
    fill: "none",
    style: {
      position: "absolute",
      left: 0.55,
      top: 0.799,
      width: 20.9,
      height: 20.401
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 12.068 0.108 L 20.9 19.943 L 19.875 20.401 L 11.043 0.566 L 12.068 0.108 Z M 0 20.388 L 0 0 L 1.133 0 L 1.133 20.388 L 0 20.388 Z M 6.796 20.388 L 6.796 0 L 7.929 0 L 7.929 20.388 L 6.796 20.388 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { LibrarySmall, __ds_default_components_kit_LibrarySmall_14dg4f: LibrarySmall });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/LibrarySmall.jsx", error: String((e && e.message) || e) }); }

// components/kit/ListeningOn.jsx
try { (() => {
// figma node: 29:1718 Listening on
function ListeningOn(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 16,
      height: 16,
      position: "relative",
      color: "rgb(25,20,20)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 16.001,
    height: 13,
    viewBox: "0 0 16.001 13",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 2,
      width: 16.001,
      height: 13
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 3.001 10 L 13.001 10 C 13.551 10 14.001 9.55 14.001 9 L 14.001 1 C 14.001 0.45 13.551 0 13.001 0 L 3.001 0 C 2.451 0 2.001 0.45 2.001 1 L 2.001 9 C 2.001 9.55 2.451 10 3.001 10 L 3.001 10 Z M 3.001 1 L 13.001 1 L 13.001 9 L 3.001 9 L 3.001 1 L 3.001 1 Z M 15.501 12 L 0.5 12 C 0.225 12 0 12.225 0 12.5 C 0 12.775 0.225 13 0.5 13 L 15.501 13 C 15.776 13 16.001 12.775 16.001 12.5 C 16.001 12.225 15.776 12 15.501 12 L 15.501 12 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { ListeningOn, __ds_default_components_kit_ListeningOn_13wzh6j: ListeningOn });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/ListeningOn.jsx", error: String((e && e.message) || e) }); }

// components/kit/SearchLink.jsx
try { (() => {
// figma node: 107:3619 Search Link
function SearchLink(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 192,
      height: 109,
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(152,84,178)",
      position: "relative",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 66.971,
    height: 66.971,
    viewBox: "0 0 66.971 66.971",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0.940,0.342,-0.342,0.940,154.729,28.338)",
      transformOrigin: "0 0",
      width: 66.971,
      height: 66.971,
      overflow: "hidden",
      borderRadius: 2,
      filter: "drop-shadow(-1px 2px 3px rgba(0,0,0,0.25))",
      color: "rgb(31,31,33)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 0 2 C 0 0.895 0.895 0 2 0 L 64.971 0 C 66.075 0 66.971 0.895 66.971 2 L 66.971 64.971 C 66.971 66.075 66.075 66.971 64.971 66.971 L 2 66.971 C 0.895 66.971 0 66.075 0 64.971 L 0 2 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0.940,0.342,-0.342,0.940,154.729,28.338)",
      transformOrigin: "0 0",
      width: 66.971,
      height: 66.971,
      overflow: "hidden",
      borderRadius: 2,
      backgroundColor: "rgb(31,31,33)",
      boxShadow: "-1px 2px 3px 0px rgba(0,0,0,0.25)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0.999,0.037,-0.037,0.999,6.737,23.035)",
      transformOrigin: "0 0",
      width: 55,
      height: 19,
      fontFamily: "\"Avenir Next\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
      fontWeight: 700,
      fontSize: 12,
      textAlign: "center",
      whiteSpace: "nowrap",
      lineHeight: "100%",
      color: "rgb(255,255,255)"
    }
  }, props.text1 ?? "Album")), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 16,
      top: 16,
      width: 31,
      height: 44,
      fontFamily: "\"Avenir Next\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
      fontWeight: 700,
      fontSize: 16,
      lineHeight: "100%",
      color: "rgb(255,255,255)",
      whiteSpace: "pre-wrap"
    }
  }, props.text2 ?? "Pop\n"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      transform: "matrix(0.941,0.340,-0.340,0.941,154.874,28)",
      transformOrigin: "0 0",
      width: 67.331,
      height: 67.331,
      borderRadius: 10,
      boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.6)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fig-asset-48598031c7ed593c",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 67.331,
      height: 67.331
    }
  })));
}
Object.assign(__ds_scope, { SearchLink, __ds_default_components_kit_SearchLink_qscofp: SearchLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/SearchLink.jsx", error: String((e && e.message) || e) }); }

// components/kit/Share.jsx
try { (() => {
// figma node: 158:1720 Share
function Share(_p = {}) {
  const props = _p;
  return /*#__PURE__*/React.createElement("div", {
    className: props.className,
    style: {
      width: 13.95,
      height: 19.481,
      position: "relative",
      color: "rgb(71,70,75)",
      ...props.style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 13.950,
    height: 19.481,
    viewBox: "0 0 13.950 19.481",
    fill: "none",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 13.95,
      height: 19.481
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 7.44 1.871 L 9.701 4.65 L 10.23 4 L 6.975 0 L 3.72 4 L 4.249 4.65 L 6.51 1.871 L 6.51 13.02 L 7.44 13.02 L 7.44 1.871 Z M 11.013 6.999 L 11.013 7.328 L 11.013 7.656 L 13.216 7.656 L 13.216 18.824 L 0.734 18.824 L 0.734 7.656 L 2.937 7.656 L 2.937 6.999 L 0 6.999 L 0 19.481 L 13.95 19.481 L 13.95 6.999 L 11.013 6.999 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })));
}
Object.assign(__ds_scope, { Share, __ds_default_components_kit_Share_15pctms: Share });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kit/Share.jsx", error: String((e && e.message) || e) }); }

// components/media/CoverArt.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * CoverArt — square album/track artwork with the kit's radii.
 * `shape="circle"` renders an artist avatar; `shape="rounded"` a playlist tile.
 */
function CoverArt({
  src,
  alt = '',
  size = 160,
  shape = 'square',
  fallback = 'var(--surface-2, #282828)',
  style,
  ...rest
}) {
  const radius = shape === 'circle' ? '50%' : shape === 'rounded' ? 7 : 4;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: size,
      height: size,
      borderRadius: radius,
      overflow: 'hidden',
      background: fallback,
      flexShrink: 0,
      boxShadow: shape === 'square' ? '0 4px 24px rgba(0,0,0,0.4)' : 'none',
      ...style
    }
  }, rest), src && /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }));
}
Object.assign(__ds_scope, { CoverArt, __ds_default_components_media_CoverArt_1y9dknj: CoverArt });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/CoverArt.jsx", error: String((e && e.message) || e) }); }

// components/media/GenreCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * GenreCard — the colored "Browse all" / "Your top genres" category tile.
 * Bold white label top-left; a rotated cover thumbnail peeks from the
 * bottom-right corner (verbatim: 4px radius, rotated album at ~20°).
 */
function GenreCard({
  label,
  color = 'var(--tile-purple, #9854B2)',
  cover,
  width = 172,
  height = 100,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    style: {
      position: 'relative',
      width,
      height,
      border: 'none',
      borderRadius: 4,
      background: color,
      overflow: 'hidden',
      cursor: 'pointer',
      textAlign: 'left',
      padding: 0,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 16,
      top: 14,
      right: 8,
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 16,
      lineHeight: 1.1,
      color: 'var(--text-white, #fff)'
    }
  }, label), cover && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: -18,
      bottom: -6,
      width: 62,
      height: 62,
      borderRadius: 2,
      overflow: 'hidden',
      transform: 'rotate(25deg)',
      boxShadow: '-1px 2px 3px rgba(0,0,0,0.25)',
      background: 'var(--surface-2, #282828)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: cover,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  })));
}
Object.assign(__ds_scope, { GenreCard, __ds_default_components_media_GenreCard_1uyl4ic: GenreCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/GenreCard.jsx", error: String((e && e.message) || e) }); }

// components/media/NowPlayingBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * NowPlayingBar — the docked mini-player above the tab bar. Background is a
 * muted tone pulled from the album art. Shows cover, title•artist, an active
 * Bluetooth device label (green), and a play/pause control over a progress rail.
 */
function NowPlayingBar({
  cover,
  title,
  artist,
  device,
  playing = true,
  progress = 0.3,
  color = '#3B1E22',
  onToggle,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderRadius: 6,
      background: color,
      padding: '8px 10px 10px',
      boxShadow: '0 4px 4px rgba(0,0,0,0.25)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 7,
      overflow: 'hidden',
      flexShrink: 0,
      background: 'var(--surface-2,#282828)'
    }
  }, cover && /*#__PURE__*/React.createElement("img", {
    src: cover,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: 13.5,
      letterSpacing: '-0.03em',
      color: 'var(--text-white,#fff)',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), artist && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: 13.5,
      color: 'var(--text-sub,#B3B3B3)',
      flexShrink: 0
    }
  }, "\u2022 ", artist)), device && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "IconsControlCenterBluetooth",
    size: 14,
    style: {
      color: 'var(--green-bright,#1ED760)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 10.5,
      letterSpacing: '0.04em',
      color: 'var(--green-press,#17B54E)'
    }
  }, device))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onToggle,
    "aria-label": playing ? 'Pause' : 'Play',
    style: {
      background: 'none',
      border: 'none',
      padding: 6,
      cursor: 'pointer',
      color: 'var(--text-white,#fff)',
      flexShrink: 0
    }
  }, playing ? /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "18",
    viewBox: "0 0 12 14",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    width: "4",
    height: "14",
    rx: "0.4"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "8",
    width: "4",
    height: "14",
    rx: "0.4"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "18",
    viewBox: "0 0 12 14",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 0.5 L12 7 L0 13.5 Z"
  })))), /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
    value: progress,
    height: 2,
    trackColor: "rgba(255,255,255,0.28)",
    color: "var(--text-white,#fff)",
    style: {
      marginTop: 8
    }
  }));
}
Object.assign(__ds_scope, { NowPlayingBar, __ds_default_components_media_NowPlayingBar_wb5qzq: NowPlayingBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/NowPlayingBar.jsx", error: String((e && e.message) || e) }); }

// components/media/SectionHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SectionHeader — the large bold heading that opens a home/library shelf
 * ("Recently played", "Editor's picks"). Optional trailing action icons.
 */
function SectionHeader({
  title,
  size = 24,
  action,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: size,
      letterSpacing: '-0.01em',
      color: 'var(--text-white, #fff)'
    }
  }, title), action && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 20
    }
  }, action));
}
Object.assign(__ds_scope, { SectionHeader, __ds_default_components_media_SectionHeader_d9ij7r: SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/media/TrackRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * TrackRow — a single song row in an album / playlist list.
 * Shows optional downloaded badge, title, artist and a trailing "more" button.
 * When `playing`, the title paints green and an equalizer replaces the badge.
 */
function TrackRow({
  title,
  artist,
  downloaded = false,
  playing = false,
  onMore,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 0',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 16,
      color: playing ? 'var(--green-bright, #1ED760)' : 'var(--text-white, #fff)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 3
    }
  }, downloaded && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: 'var(--green-core, #1DB954)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "8",
    viewBox: "0 0 8 8",
    fill: "var(--text-black,#191414)",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 6.5 L0.5 3 H2.5 V0 H5.5 V3 H7.5 Z"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: 13,
      color: 'var(--text-sub, #B3B3B3)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, artist))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onMore,
    "aria-label": "More options",
    style: {
      background: 'none',
      border: 'none',
      padding: 4,
      cursor: 'pointer',
      color: 'var(--text-sub, #B3B3B3)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "IconsAppsAppStoreMore",
    size: 24,
    style: {
      display: 'block'
    }
  })));
}
Object.assign(__ds_scope, { TrackRow, __ds_default_components_media_TrackRow_rkqrrq: TrackRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/TrackRow.jsx", error: String((e && e.message) || e) }); }

// components/navigation/FilterChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * FilterChip — the rounded filter pill used in the library / playlist filters
 * ("Playlists", "Albums", "Artists"). Selected = green fill, black text.
 */
function FilterChip({
  children,
  selected = false,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    "aria-pressed": selected,
    style: {
      border: 'none',
      borderRadius: 'var(--radius-pill, 999px)',
      padding: '7px 14px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: 13,
      cursor: 'pointer',
      background: selected ? 'var(--green-core, #1DB954)' : 'var(--surface-2, #282828)',
      color: selected ? 'var(--text-black, #191414)' : 'var(--text-white, #fff)',
      whiteSpace: 'nowrap',
      transition: 'background .12s ease',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { FilterChip, __ds_default_components_navigation_FilterChip_1u4yvr7: FilterChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/FilterChip.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TABS = [{
  id: 'home',
  label: 'Home',
  on: 'HomeSolid',
  off: 'HomeOutline'
}, {
  id: 'search',
  label: 'Search',
  on: 'SearchSolid',
  off: 'SearchOutline'
}, {
  id: 'library',
  label: 'Your Library',
  on: 'LibrarySolid',
  off: 'LibraryOutline'
}];

/**
 * TabBar — the bottom navigation (Home / Search / Your Library). Active tab
 * uses the solid glyph + white label; inactive uses the outline + grey.
 */
function TabBar({
  active = 'home',
  onChange,
  tabs = TABS,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      paddingTop: 8,
      background: 'linear-gradient(to top, #101010 60%, rgba(16,16,16,0))',
      ...style
    }
  }, rest), tabs.map(t => {
    const isOn = t.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      type: "button",
      onClick: () => onChange && onChange(t.id),
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px 8px',
        color: isOn ? 'var(--text-white,#fff)' : 'var(--text-sub,#B3B3B3)'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: isOn ? t.on : t.off,
      size: 24,
      style: {
        display: 'block'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontWeight: isOn ? 600 : 500,
        fontSize: 10
      }
    }, t.label));
  }));
}
Object.assign(__ds_scope, { TabBar, __ds_default_components_navigation_TabBar_4yk81x: TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/system/StatusBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * StatusBar — the iPhone X status bar (time • location arrow • signal • wifi •
 * battery). `tint` recolors every glyph to sit on light or dark backgrounds.
 */
function StatusBar({
  time = '1:20',
  tint = 'var(--text-white, #fff)',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 44,
      padding: '0 24px 0 30px',
      color: tint,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: 15,
      letterSpacing: '0.01em'
    }
  }, time), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "IconsSystemStatusBarLocation",
    size: 13,
    style: {
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "IconsSystemStatusBarSignal",
    size: 17,
    style: {
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "IconsSystemStatusBarWifi",
    size: 16,
    style: {
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "IconsSystemStatusBarBattery",
    size: 26,
    style: {
      display: 'block'
    }
  })));
}
Object.assign(__ds_scope, { StatusBar, __ds_default_components_system_StatusBar_7dm6yv: StatusBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/system/StatusBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/spotify-mobile/screens.jsx
try { (() => {
// Spotify Mobile UI kit — screen components. Exposed on window for index.html.
const {
  Icon,
  IconButton,
  PillButton,
  PlayButton,
  ProgressBar,
  Equalizer,
  CoverArt,
  GenreCard,
  NowPlayingBar,
  SectionHeader,
  TrackRow,
  FilterChip,
  SearchField,
  Logo
} = window.SpotifyMobileDesignSystem_e52d1c;
const IMG = n => `../../assets/img/${n}.png`;
const RECENT = [{
  name: '1 (Remastered)',
  img: IMG('beatles-1'),
  shape: 'square',
  album: true
}, {
  name: 'Lana Del Rey',
  img: IMG('lana'),
  shape: 'circle'
}, {
  name: 'Marvin Gaye',
  img: IMG('marvin'),
  shape: 'circle'
}, {
  name: 'Indie',
  img: IMG('indie'),
  shape: 'square'
}];
const ALBUM_TRACKS = [{
  title: 'Love Me Do - Mono / Remastered',
  artist: 'The Beatles',
  downloaded: true
}, {
  title: 'From Me to You - Mono / Remastered',
  artist: 'The Beatles',
  downloaded: true,
  playing: true
}, {
  title: 'She Loves You - Mono / Remastered',
  artist: 'The Beatles',
  downloaded: true
}, {
  title: 'I Want To Hold Your Hand - Remastered 2015',
  artist: 'The Beatles',
  downloaded: true
}, {
  title: "Can't Buy Me Love - Remastered 2009",
  artist: 'The Beatles',
  downloaded: true
}, {
  title: 'A Hard Day’s Night - Remastered 2009',
  artist: 'The Beatles'
}];
const scrollArea = {
  flex: 1,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  padding: '4px 16px 12px'
};

/* ------------------------------- HOME ------------------------------- */
function HomeScreen({
  onOpenAlbum
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: scrollArea
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    title: "Recently played",
    action: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
      name: "IconsAppsInstagramAdd",
      size: 22,
      style: {
        color: '#fff'
      }
    }), /*#__PURE__*/React.createElement(Icon, {
      name: "IconSettings",
      size: 22,
      style: {
        color: '#fff'
      }
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      overflowX: 'auto',
      margin: '16px -16px 0',
      padding: '0 16px 4px'
    }
  }, RECENT.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 120,
      flexShrink: 0,
      cursor: 'pointer'
    },
    onClick: () => r.album && onOpenAlbum()
  }, /*#__PURE__*/React.createElement(CoverArt, {
    src: r.img,
    size: 120,
    shape: r.shape
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      marginTop: 8,
      textAlign: 'center',
      color: '#fff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, r.name)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG('wrapped'),
    alt: "",
    style: {
      width: 56,
      height: 56,
      borderRadius: 4,
      objectFit: 'cover'
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      color: 'var(--text-sub)'
    }
  }, "#SPOTIFYWRAPPED"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: '#fff',
      letterSpacing: '-0.01em'
    }
  }, "Your 2021 in review"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CoverArt, {
    src: IMG('top-songs'),
    size: '100%',
    style: {
      width: '100%',
      aspectRatio: '1',
      height: 'auto'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      marginTop: 8,
      color: '#fff'
    }
  }, "Your Top Songs 2021")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CoverArt, {
    src: IMG('artists-revealed'),
    size: '100%',
    style: {
      width: '100%',
      aspectRatio: '1',
      height: 'auto'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      marginTop: 8,
      color: '#fff'
    }
  }, "Your Artists Revealed"))), /*#__PURE__*/React.createElement(SectionHeader, {
    title: "Editor\u2019s picks",
    style: {
      marginTop: 30
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      overflowX: 'auto',
      margin: '16px -16px 0',
      padding: '0 16px 4px'
    }
  }, [['editor1', 'Ed Sheeran, Big Sean, Juice WRLD, Post Malone'], ['editor2', 'Mitski, Tame Impala, Glass Animals, Charli XCX'], ['editor3', 'SZA, Doja Cat, Kali Uchis, H.E.R.']].map(([img, sub], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 152,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(CoverArt, {
    src: IMG(img),
    size: 152
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-sub)',
      marginTop: 8,
      lineHeight: 1.35
    }
  }, sub)))));
}

/* ------------------------------ SEARCH ------------------------------ */
function SearchScreen() {
  const tiles = [['Pop', 'tile-purple'], ['Indie', 'tile-olive'], ['News & Politics', 'tile-blue'], ['Comedy', 'tile-orange'], ['2021 Wrapped', 'tile-olive'], ['Podcasts', 'tile-navy'], ['Made for you', 'green-core'], ['Charts', 'tile-purple']];
  return /*#__PURE__*/React.createElement("div", {
    style: scrollArea
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 28,
      fontWeight: 700,
      color: '#fff'
    }
  }, "Search"), /*#__PURE__*/React.createElement(Icon, {
    name: "IconsAppsMusicAirplay",
    size: 26,
    style: {
      color: '#fff'
    }
  })), /*#__PURE__*/React.createElement(SearchField, null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: '#fff',
      margin: '26px 0 14px'
    }
  }, "Your top genres"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(GenreCard, {
    label: "Pop",
    color: "var(--tile-purple)",
    cover: IMG('editor2'),
    width: "100%",
    height: 100
  }), /*#__PURE__*/React.createElement(GenreCard, {
    label: "Indie",
    color: "var(--tile-olive)",
    cover: IMG('editor2'),
    width: "100%",
    height: 100
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: '#fff',
      margin: '26px 0 14px'
    }
  }, "Popular podcast categories"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(GenreCard, {
    label: "News & Politics",
    color: "var(--tile-blue)",
    cover: IMG('editor2'),
    width: "100%",
    height: 100
  }), /*#__PURE__*/React.createElement(GenreCard, {
    label: "Comedy",
    color: "var(--tile-orange)",
    cover: IMG('editor2'),
    width: "100%",
    height: 100
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: '#fff',
      margin: '26px 0 14px'
    }
  }, "Browse all"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, tiles.slice(4).map(([l, c], i) => /*#__PURE__*/React.createElement(GenreCard, {
    key: i,
    label: l,
    color: `var(--${c})`,
    cover: IMG('editor1'),
    width: "100%",
    height: 100
  }))));
}

/* ------------------------------ LIBRARY ----------------------------- */
function LibraryScreen() {
  const [filter, setFilter] = React.useState('Playlists');
  const items = [{
    name: 'Liked Songs',
    meta: 'Playlist • 58 songs',
    liked: true
  }, {
    name: 'From Me to You',
    meta: 'Album • The Beatles',
    img: IMG('beatles-1')
  }, {
    name: 'Discover Weekly',
    meta: 'Playlist • Spotify',
    img: IMG('top-songs')
  }, {
    name: 'Marvin Gaye',
    meta: 'Artist',
    img: IMG('marvin'),
    circle: true
  }, {
    name: 'This Is Lana Del Rey',
    meta: 'Playlist • Spotify',
    img: IMG('lana')
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: scrollArea
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      margin: '2px 0 18px'
    }
  }, /*#__PURE__*/React.createElement(CoverArt, {
    src: IMG('marvin'),
    size: 32,
    shape: "circle"
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      flex: 1,
      fontSize: 24,
      fontWeight: 700,
      color: '#fff'
    }
  }, "Your Library"), /*#__PURE__*/React.createElement(Icon, {
    name: "SearchSolid",
    size: 22,
    style: {
      color: '#fff'
    }
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "IconsAppsInstagramAdd",
    size: 22,
    style: {
      color: '#fff'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginBottom: 8
    }
  }, ['Playlists', 'Albums', 'Artists'].map(c => /*#__PURE__*/React.createElement(FilterChip, {
    key: c,
    selected: filter === c,
    onClick: () => setFilter(c)
  }, c))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '9px 0'
    }
  }, it.liked ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 4,
      background: 'var(--grad-liked)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "HeartSolid",
    size: 22,
    style: {
      color: '#fff'
    }
  })) : /*#__PURE__*/React.createElement(CoverArt, {
    src: it.img,
    size: 56,
    shape: it.circle ? 'circle' : 'square'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: '#fff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, it.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--text-sub)',
      marginTop: 3
    }
  }, it.meta))))));
}

/* ---------------------------- ALBUM VIEW ---------------------------- */
function AlbumScreen({
  onBack,
  onOpenPlayer
}) {
  const [playing, setPlaying] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      background: 'linear-gradient(180deg, #7a1f14 0%, #3a140e 38%, var(--bg-base) 62%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 16px 16px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "Back",
    style: {
      background: 'none',
      border: 'none',
      padding: '6px 0',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronLeft",
    size: 22,
    style: {
      color: '#fff'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(CoverArt, {
    src: IMG('beatles-1'),
    size: 210
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '28px 0 0',
      fontSize: 30,
      fontWeight: 700,
      color: '#fff'
    }
  }, "1 (Remastered)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(CoverArt, {
    src: IMG('marvin'),
    size: 24,
    shape: "circle"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: '#fff'
    }
  }, "The Beatles")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--text-sub)',
      marginTop: 8
    }
  }, "Album \u2022 2000"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    name: "HeartSolid",
    color: "var(--text-sub)",
    size: 24
  }), /*#__PURE__*/React.createElement(IconButton, {
    name: "Back",
    filled: true,
    circleColor: "var(--green-core)",
    size: 28,
    label: "Download"
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "IconsAppsAppStoreMore",
    size: 24,
    style: {
      color: 'var(--text-sub)'
    }
  })), /*#__PURE__*/React.createElement(PlayButton, {
    playing: playing,
    onClick: () => setPlaying(p => !p)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 16px 24px',
      background: 'var(--bg-base)'
    },
    onClick: onOpenPlayer
  }, ALBUM_TRACKS.map((t, i) => /*#__PURE__*/React.createElement(TrackRow, {
    key: i,
    title: t.title,
    artist: t.artist,
    downloaded: t.downloaded,
    playing: t.playing
  }))));
}

/* --------------------------- NOW PLAYING ---------------------------- */
function PlayerScreen({
  onClose
}) {
  const [playing, setPlaying] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 24px 28px',
      background: 'linear-gradient(180deg, #8a2118 0%, #2a1712 60%, #121212 100%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "IconChevronDown",
    size: 26,
    style: {
      color: '#fff'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.04em',
      color: '#fff',
      textTransform: 'uppercase'
    }
  }, "1 (Remastered)"), /*#__PURE__*/React.createElement(Icon, {
    name: "IconsAppsAppStoreMore",
    size: 22,
    style: {
      color: '#fff'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(CoverArt, {
    src: IMG('beatles-1'),
    size: '100%',
    style: {
      width: '100%',
      aspectRatio: '1',
      height: 'auto'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: '#fff'
    }
  }, "From Me to You"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: 'var(--text-sub)',
      marginTop: 4
    }
  }, "The Beatles")), /*#__PURE__*/React.createElement(IconButton, {
    name: "HeartSolid",
    active: true,
    size: 26,
    style: {
      marginTop: 6
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: 0.42,
    knob: true,
    color: "#fff"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 6,
      fontSize: 11,
      color: 'var(--text-sub)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "0:52"), /*#__PURE__*/React.createElement("span", null, "-1:11"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    name: "Shuffle",
    active: true,
    size: 22
  }), /*#__PURE__*/React.createElement(IconButton, {
    name: "Back",
    size: 30
  }), /*#__PURE__*/React.createElement(PlayButton, {
    playing: playing,
    size: 64,
    onClick: () => setPlaying(p => !p)
  }), /*#__PURE__*/React.createElement(IconButton, {
    name: "Forward",
    size: 30
  }), /*#__PURE__*/React.createElement(IconButton, {
    name: "Repeat",
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "IconsControlCenterBluetooth",
    size: 15,
    style: {
      color: 'var(--green-bright)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--green-press)'
    }
  }, "BEATSPILL+")));
}
Object.assign(window, {
  HomeScreen,
  SearchScreen,
  LibraryScreen,
  AlbumScreen,
  PlayerScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/spotify-mobile/screens.jsx", error: String((e && e.message) || e) }); }

if (__ds_scope.__ds_default_components_icons_icon_data_12stud1$1nb03e1 === undefined) __ds_scope.__ds_default_components_icons_icon_data_12stud1$1nb03e1 = __ds_scope.__ds_default_components_icons_icon_data_12stud1;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.PillButton = __ds_scope.PillButton;

__ds_ns.PlayButton = __ds_scope.PlayButton;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Equalizer = __ds_scope.Equalizer;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.ArrowNarrowDown1 = __ds_scope.ArrowNarrowDown1;

__ds_ns.ButtonM = __ds_scope.ButtonM;

__ds_ns.Component17 = __ds_scope.Component17;

__ds_ns.Component18 = __ds_scope.Component18;

__ds_ns.Component19 = __ds_scope.Component19;

__ds_ns.Component20 = __ds_scope.Component20;

__ds_ns.Component27 = __ds_scope.Component27;

__ds_ns.Component28 = __ds_scope.Component28;

__ds_ns.Component29 = __ds_scope.Component29;

__ds_ns.Component30 = __ds_scope.Component30;

__ds_ns.Component31 = __ds_scope.Component31;

__ds_ns.Component32 = __ds_scope.Component32;

__ds_ns.Component33 = __ds_scope.Component33;

__ds_ns.Component34 = __ds_scope.Component34;

__ds_ns.Component35 = __ds_scope.Component35;

__ds_ns.Component36 = __ds_scope.Component36;

__ds_ns.Component37 = __ds_scope.Component37;

__ds_ns.Component9 = __ds_scope.Component9;

__ds_ns.CoverDisc = __ds_scope.CoverDisc;

__ds_ns.LibrarySmall = __ds_scope.LibrarySmall;

__ds_ns.ListeningOn = __ds_scope.ListeningOn;

__ds_ns.SearchLink = __ds_scope.SearchLink;

__ds_ns.Share = __ds_scope.Share;

__ds_ns.CoverArt = __ds_scope.CoverArt;

__ds_ns.GenreCard = __ds_scope.GenreCard;

__ds_ns.NowPlayingBar = __ds_scope.NowPlayingBar;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.TrackRow = __ds_scope.TrackRow;

__ds_ns.FilterChip = __ds_scope.FilterChip;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.StatusBar = __ds_scope.StatusBar;

})();
