import React from 'react';

export default function SchoolMap({
  spaces,
  selectedSpaceId,
  onSpaceSelect,
  pulsingSpaceId,
  matchingSpaceIds = [],
  hasSearchActive = false
}) {
  // Helper to find a space object from props by id or svg alias
  const getSpaceById = (configId) => {
    return spaces.find(s => s.id === configId) || {
      id: configId,
      name: configId,
      status: 'LIVRE',
      capacity: 30
    };
  };

  const getShortName = (space) => {
    if (!space.name) return space.id;
    if (space.name.includes(' - ')) return space.name.split(' - ')[0].trim();
    return space.name;
  };

  const getRoomEmoji = (space) => {
    const name = (space.name || '').toLowerCase();
    const type = (space.type || '').toLowerCase();
    if (name.includes('biblioteca') || type.includes('biblioteca')) return '📚';
    if (name.includes('teatro') || name.includes('auditório') || type.includes('auditório')) return '🎭';
    if (name.includes('quadra') || type.includes('esporte')) return '🏀';
    if (name.includes('informática') || name.includes('info')) return '💻';
    if (name.includes('ciência') || name.includes('química') || name.includes('lab')) return '🔬';
    if (name.includes('guarita')) return '🧭';
    if (name.includes('banheiro')) return '🚻';
    return '🏫';
  };

  const renderMiniPlanter = (x, y) => {
    return (
      <g style={{ pointerEvents: 'none' }} key={`planter-${x}-${y}`}>
        <polygon points={`${x-3},${y} ${x+3},${y} ${x+2.2},${y+4} ${x-2.2},${y+4}`} fill="#1e293b" stroke="#0f172a" strokeWidth="0.4" />
        <line x1={x} y1={y} x2={x} y2={y-10} stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
        <path d={`M ${x},${y-10} Q ${x-6},${y-12} ${x-8},${y-8}`} fill="none" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" />
        <path d={`M ${x},${y-10} Q ${x+6},${y-12} ${x+8},${y-8}`} fill="none" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" />
        <path d={`M ${x},${y-10} Q ${x-3},${y-17} ${x-4},${y-20}`} fill="none" stroke="#16a34a" strokeWidth="1.0" strokeLinecap="round" />
        <path d={`M ${x},${y-10} Q ${x+3},${y-17} ${x+4},${y-20}`} fill="none" stroke="#16a34a" strokeWidth="1.0" strokeLinecap="round" />
      </g>
    );
  };

  const renderArchitecturalBuilding = (space, svgPathId, cx, cy, w, d, h) => {
    const topPoints = `${cx},${cy - d} ${cx + w},${cy} ${cx},${cy + d} ${cx - w},${cy}`;
    const leftPoints = `${cx - w},${cy} ${cx},${cy + d} ${cx},${cy + d + h} ${cx - w},${cy + h}`;
    const rightPoints = `${cx},${cy + d} ${cx + w},${cy} ${cx + w},${cy + h} ${cx},${cy + d + h}`;

    // 1. BIBLIOTECA CENTRAL
    if (svgPathId === 'room-library' || space.id === 'biblioteca') {
      return (
        <g>
          <polygon points={leftPoints} className="isometric-face left" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.5" />
          <line x1={cx - w*0.5} y1={cy + d*0.25 + h} x2={cx - w*0.5} y2={cy + d*0.25 + h*0.3} stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1={cx - w*0.2} y1={cy + d*0.4 + h} x2={cx - w*0.2} y2={cy + d*0.4 + h*0.3} stroke="#cbd5e1" strokeWidth="2.5" />
          <polygon points={`${cx - w*0.55},${cy + d*0.22 + h*0.3} ${cx - w*0.15},${cy + d*0.42 + h*0.3} ${cx - w*0.15},${cy + d*0.42 + h*0.3 - 4} ${cx - w*0.55},${cy + d*0.22 + h*0.3 - 4}`} fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
          <polygon points={rightPoints} className="isometric-face right" fill="#7f1d1d" stroke="#451a03" strokeWidth="0.5" />
          <polygon points={`${cx + w*0.25},${cy + d*0.75 + h*0.3} ${cx + w*0.75},${cy + d*0.25 + h*0.3} ${cx + w*0.75},${cy + d*0.25 + h*0.65} ${cx + w*0.25},${cy + d*0.75 + h*0.65}`} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" opacity="0.8" />
          <polygon points={topPoints} className="isometric-face top" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
          <polygon points={`${cx - w*0.4},${cy - d*0.1} ${cx},${cy - d*0.5} ${cx + w*0.2},${cy - d*0.3} ${cx - w*0.2},${cy + d*0.1}`} fill="#22c55e" stroke="#16a34a" strokeWidth="0.5" />
          <circle cx={cx - w*0.1} cy={cy - d*0.25} r="2.0" fill="#ef4444" />
          <circle cx={cx + w*0.05} cy={cy - d*0.32} r="1.6" fill="#fbbf24" />
          <polygon points={`${cx},${cy + d*0.2} ${cx + w*0.5},${cy - d*0.2} ${cx + w*0.2},${cy} ${cx - w*0.3},${cy + d*0.4}`} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" opacity="0.8" />
          <line x1={cx + w*0.1} y1={cy} x2={cx + w*0.35} y2={cy - d*0.1} stroke="#ffffff" strokeWidth="0.5" />
          {renderMiniPlanter(cx - w*0.7, cy + d*0.15 + h - 2)}
          {renderMiniPlanter(cx + w*0.1, cy + d*0.45 + h - 2)}
        </g>
      );
    }

    // 2. AUDITÓRIO PRINCIPAL
    if (svgPathId === 'room-auditorium' || space.id === 'auditorio') {
      return (
        <g>
          <polygon points={leftPoints} className="isometric-face left" fill="#f97316" stroke="#ea580c" strokeWidth="0.5" />
          <polygon points={rightPoints} className="isometric-face right" fill="#ea580c" stroke="#c2410c" strokeWidth="0.5" />
          <polygon points={`${cx + w*0.35},${cy + d*0.45 + h} ${cx + w*0.35},${cy + d*0.45 + h*0.4} ${cx + w*0.65},${cy + d*0.25 + h*0.4} ${cx + w*0.65},${cy + d*0.25 + h}`} fill="#1e293b" stroke="#0f172a" strokeWidth="0.5" />
          <line x1={cx + w*0.5} y1={cy + d*0.35 + h} x2={cx + w*0.5} y2={cy + d*0.35 + h*0.4} stroke="#ffffff" strokeWidth="0.8" />
          <polygon points={topPoints} className="isometric-face top" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
          <g transform={`translate(${cx - 15}, ${cy - d*0.25})`}>
            <ellipse cx="15" cy="0" rx="20" ry="10" fill="#64748b" stroke="#475569" strokeWidth="0.5" />
            <path d="M -5,0 C -5,-16 35,-16 35,0 Z" fill="url(#water-grad)" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
            <path d="M 5,-7 C 10,-14 20,-14 25,-7" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.8" />
            <path d="M -2,-3 C 5,-10 25,-10 32,-3" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.8" />
            <line x1="15" y1="-12" x2="15" y2="0" stroke="#ffffff" strokeWidth="0.5" opacity="0.8" />
            <line x1="5" y1="-7" x2="15" y2="0" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />
            <line x1="25" y1="-7" x2="15" y2="0" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />
          </g>
          {renderMiniPlanter(cx + w*0.2, cy + d*0.6 + h - 2)}
          {renderMiniPlanter(cx + w*0.8, cy + d*0.1 + h - 2)}
        </g>
      );
    }

    // 3. TEATRO / SALA DOS PROFESSORES
    if (svgPathId === 'room-staff' || space.id === 'teatro') {
      return (
        <g>
          <polygon points={leftPoints} className="isometric-face left" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
          <polygon points={`${cx - w*0.75},${cy + d*0.12 + h*0.25} ${cx - w*0.25},${cy + d*0.37 + h*0.25} ${cx - w*0.25},${cy + d*0.37 + h*0.7} ${cx - w*0.75},${cy + d*0.12 + h*0.7}`} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" opacity="0.8" />
          <polygon points={rightPoints} className="isometric-face right" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
          <polygon points={`${cx + w*0.2},${cy + d*0.6 + h*0.15} ${cx + w*0.85},${cy + d*0.12 + h*0.15} ${cx + w*0.85},${cy + d*0.12 + h*0.85} ${cx + w*0.2},${cy + d*0.6 + h*0.85}`} fill="#d97706" stroke="#b45309" strokeWidth="0.5" />
          <polygon points={topPoints} className="isometric-face top" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
          {renderMiniPlanter(cx - w*0.5, cy + d*0.25 + h - 2)}
        </g>
      );
    }

    // 4. LABORATÓRIO DE INFORMÁTICA
    if (svgPathId === 'room-info' || space.id === 'lab-info') {
      return (
        <g>
          <polygon points={leftPoints} className="isometric-face left" fill="#0d2544" stroke="#030712" strokeWidth="0.5" />
          <polygon points={`${cx - w*0.8},${cy + d*0.1 + h*0.3} ${cx - w*0.2},${cy + d*0.4 + h*0.3} ${cx - w*0.2},${cy + d*0.4 + h*0.6} ${cx - w*0.8},${cy + d*0.1 + h*0.6}`} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" opacity="0.8" />
          <polygon points={rightPoints} className="isometric-face right" fill="#030712" stroke="#020617" strokeWidth="0.5" />
          <polygon points={topPoints} className="isometric-face top" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
          <g transform={`translate(${cx - 10}, ${cy - d*0.35})`}>
            <line x1="0" y1="1" x2="0" y2="-5" stroke="#475569" strokeWidth="1.2" />
            <line x1="20" y1="11" x2="20" y2="5" stroke="#475569" strokeWidth="1.2" />
            <polygon points="-8,-9 22,6 28,2 18,-13" fill="#1e293b" stroke="#cbd5e1" strokeWidth="0.8" />
          </g>
          {renderMiniPlanter(cx - w*0.6, cy + d*0.2 + h - 2)}
        </g>
      );
    }

    // 5. LABORATÓRIO DE CIÊNCIAS
    if (svgPathId === 'room-science' || space.id === 'lab-ciencias') {
      return (
        <g>
          <polygon points={leftPoints} className="isometric-face left" fill="#f0fdf4" stroke="#dcfce7" strokeWidth="0.5" />
          <polygon points={rightPoints} className="isometric-face right" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="0.5" />
          <polygon points={topPoints} className="isometric-face top" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
          <polygon points={`${cx - 10},${cy - 5} ${cx + 10},${cy + 5} ${cx},${cy + 10} ${cx},${cy - 10}`} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.6" opacity="0.75" />
          {renderMiniPlanter(cx + w*0.3, cy + d*0.55 + h - 2)}
        </g>
      );
    }

    // 6. SALAS DE AULA CONVENCIONAIS
    const isOdd = cx % 2 !== 0;
    const rimColor = isOdd ? '#f97316' : '#3b82f6';

    return (
      <g>
        <polygon points={leftPoints} className="isometric-face left" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
        <polygon points={rightPoints} className="isometric-face right" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
        <polygon points={topPoints} className="isometric-face top" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
        <polygon points={`${cx - w},${cy} ${cx},${cy + d} ${cx},${cy + d - 2.5} ${cx - w},${cy - 2.5}`} fill={rimColor} />
        <polygon points={`${cx},${cy + d} ${cx + w},${cy} ${cx + w},${cy - 2.5} ${cx},${cy + d - 2.5}`} fill={rimColor} opacity="0.8" />
        {renderMiniPlanter(cx - w*0.7, cy + d*0.15 + h - 2)}
      </g>
    );
  };

  const renderInteractiveRoomBanner = (space, cx, cy, w, d, h, isSelected, isPulsing) => {
    const pinX = cx;
    const pinY = cy - 4;
    const foWidth = 220;
    const foHeight = 44;
    
    const bannerYOffset = space.id === 'quadra' ? 55 : 65;
    const bx = pinX;
    const by = pinY - bannerYOffset;

    const emoji = getRoomEmoji(space);
    const shortName = getShortName(space);
    
    const isOccupied = space.status === 'OCUPADO';
    const isMaintenance = space.status === 'MANUTENCAO';

    let statusColor = '#16a34a'; // Green
    let statusText = 'DISPONÍVEL';

    if (isOccupied) {
      statusColor = '#dc2626';
      statusText = 'OCUPADO';
    } else if (isMaintenance) {
      statusColor = '#d97706';
      statusText = 'MANUTENÇÃO';
    }

    const foX = bx - foWidth / 2;
    const foY = by - foHeight / 2;

    return (
      <g className="room-banner-group" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
        <ellipse cx={pinX} cy={pinY} rx="7" ry="4" fill="#0f172a" opacity="0.7" />
        <line x1={pinX} y1={pinY} x2={bx} y2={by + 10} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2 2" />
        
        <foreignObject
          x={foX}
          y={foY}
          width={foWidth}
          height={foHeight}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div 
            className={`room-banner-html ${isSelected ? 'selected' : ''} ${isPulsing ? 'pulsing' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              border: `1.2px solid ${isSelected ? '#38bdf8' : statusColor}`,
              borderWidth: isSelected ? '2px' : '1.2px',
              borderRadius: '8px',
              padding: '5px 10px',
              boxShadow: isSelected 
                ? '0 10px 20px -5px rgba(56, 189, 248, 0.35), 0 0 10px rgba(56, 189, 248, 0.4)' 
                : '0 6px 12px -3px rgba(13, 37, 68, 0.1), 0 2px 4px -2px rgba(13, 37, 68, 0.05)',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: '#0d2544',
              pointerEvents: 'auto',
              margin: '0 auto',
              width: 'max-content',
              maxWidth: '190px',
              minWidth: '95px',
              boxSizing: 'border-box',
              transition: 'all 0.25s ease-in-out',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                <span style={{ fontSize: '12px', flexShrink: 0 }}>{emoji}</span>
                <span 
                  style={{ 
                    fontWeight: 800, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.2px',
                    fontSize: '10px'
                  }}
                  title={shortName}
                >
                  {shortName}
                </span>
              </div>
              <span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', flexShrink: 0, marginLeft: '3px' }}>
                👥 {space.capacity}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span 
                className="banner-status-dot-html"
                style={{ 
                  width: '4.5px', 
                  height: '4.5px', 
                  borderRadius: '50%', 
                  backgroundColor: statusColor,
                  display: 'inline-block'
                }} 
              />
              <span 
                style={{ 
                  color: statusColor, 
                  fontSize: '7.5px', 
                  fontWeight: 800, 
                  letterSpacing: '0.15px', 
                  textTransform: 'uppercase' 
                }}
              >
                {statusText}
              </span>
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };

  const renderSportsCourt = (space, cx, cy, w, d, h) => {
    const topPoints = `${cx},${cy - d} ${cx + w},${cy} ${cx},${cy + d} ${cx - w},${cy}`;
    const leftPoints = `${cx - w},${cy} ${cx},${cy + d} ${cx},${cy + d + h} ${cx - w},${cy + h}`;
    const rightPoints = `${cx},${cy + d} ${cx + w},${cy} ${cx + w},${cy + h} ${cx},${cy + d + h}`;

    return (
      <g>
        <polygon points={leftPoints} fill="#166534" stroke="#14532d" strokeWidth="0.5" />
        <polygon points={rightPoints} fill="#14532d" stroke="#0f172a" strokeWidth="0.5" />
        <polygon points={topPoints} fill="#15803d" stroke="#166534" strokeWidth="0.8" />
        <line x1={cx - w*0.5} y1={cy + d*0.25} x2={cx + w*0.5} y2={cy - d*0.25} stroke="#ffffff" strokeWidth="1.2" opacity="0.9" style={{ pointerEvents: 'none' }} />
        <ellipse cx={cx} cy={cy} rx={w*0.22} ry={d*0.22} stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.9" style={{ pointerEvents: 'none' }} />
        <circle cx={cx - 15} cy={cy + 6} r="2" fill="#f97316" style={{ pointerEvents: 'none' }} />
      </g>
    );
  };

  const roomCoordinates = [
    { id: 'lab-info', svgPathId: 'room-info', cx: 160, cy: 105, w: 50, d: 30, h: 18 },
    { id: 'lab-ciencias', svgPathId: 'room-science', cx: 370, cy: 105, w: 50, d: 30, h: 18 },
    { id: 'quadra', svgPathId: 'room-sports', cx: 640, cy: 110, w: 100, d: 42, h: 5 },
    { id: 'teatro', svgPathId: 'room-staff', cx: 910, cy: 105, w: 60, d: 35, h: 18 },
    { id: 'sala-01', svgPathId: 'room-101', cx: 110, cy: 225, w: 46, d: 28, h: 16 },
    { id: 'sala-02', svgPathId: 'room-102', cx: 275, cy: 225, w: 46, d: 28, h: 16 },
    { id: 'sala-03', svgPathId: 'room-103', cx: 440, cy: 225, w: 46, d: 28, h: 16 },
    { id: 'sala-04', svgPathId: 'room-104', cx: 605, cy: 225, w: 46, d: 28, h: 16 },
    { id: 'sala-05', svgPathId: 'room-105', cx: 770, cy: 225, w: 46, d: 28, h: 16 },
    { id: 'sala-06', svgPathId: 'room-106', cx: 935, cy: 225, w: 46, d: 28, h: 16 },
    { id: 'biblioteca', svgPathId: 'room-library', cx: 300, cy: 350, w: 85, d: 45, h: 26 },
    { id: 'auditorio', svgPathId: 'room-auditorium', cx: 680, cy: 360, w: 100, d: 55, h: 30 },
  ];

  const renderIsometricRoom = (config) => {
    const { id, svgPathId, cx, cy, w, d, h } = config;
    const space = getSpaceById(id);

    const isSelected = space.id === selectedSpaceId;
    const isPulsing = space.id === pulsingSpaceId;
    const isMatching = !hasSearchActive || matchingSpaceIds.includes(space.id);
    const statusClass = space.status === 'OCUPADO' ? 'status-booked' : 'status-free';

    const floorShadowY = cy + h + 2;
    const isSportsCourt = id === 'quadra';

    return (
      <g 
        key={space.id} 
        onClick={() => onSpaceSelect(space)} 
        className={`isometric-room-group ${statusClass} ${isSelected ? 'selected' : ''} ${isPulsing || (hasSearchActive && isMatching) ? 'pulsing' : ''}`}
        style={{
          opacity: isMatching ? 1.0 : 0.3,
          filter: !isMatching ? 'grayscale(50%)' : 'none',
          transition: 'all 0.35s ease'
        }}
      >
        <title>{`${space.name}\nTipo: ${space.type}\nCapacidade: ${space.capacity} alunos\nStatus: ${space.status}`}</title>
        
        {/* Aura Ring quando encontrada na busca */}
        {hasSearchActive && isMatching && (
          <ellipse
            cx={cx}
            cy={floorShadowY}
            rx={w * 1.15}
            ry={d * 1.1}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            opacity="0.9"
          />
        )}

        <ellipse 
          cx={cx} 
          cy={floorShadowY} 
          rx={w * 0.95} 
          ry={d * 0.9} 
          className="room-floor-shadow" 
        />
        
        <g className="room-3d-block">
          {isSportsCourt ? (
            renderSportsCourt(space, cx, cy, w, d, h)
          ) : (
            renderArchitecturalBuilding(space, svgPathId, cx, cy, w, d, h)
          )}

          <circle
            cx={cx + w - 16}
            cy={cy - 2}
            r={4.5}
            className="room-status-light"
            fill={space.status === 'OCUPADO' ? '#dc2626' : space.status === 'MANUTENCAO' ? '#d97706' : '#16a34a'}
            stroke="#ffffff"
            strokeWidth={1.5}
            style={{ pointerEvents: 'none' }}
          />
        </g>

        {renderInteractiveRoomBanner(space, cx, cy, w, d, h, isSelected, isPulsing || (hasSearchActive && isMatching))}
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 1080 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="reflow-svg-map"
    >
      <defs>
        <pattern id="tile-pattern" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <rect width="18" height="18" fill="#f8fafc" />
          <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
        </pattern>
        <radialGradient id="water-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
      </defs>

      <rect width="1080" height="500" fill="#0f172a" rx={16} />
      
      <path d="M 20 446 C 20 458, 32 468, 49 468 L 1031 468 C 1048 468, 1060 458, 1060 446 L 1060 458 C 1060 470, 1048 480, 1031 480 L 49 480 C 32 480, 20 470, 20 458 Z" fill="#1e293b" />
      <path d="M 20 446 L 20 454 C 20 462, 32 468, 49 468 L 1031 468 C 1048 468, 1060 462, 1060 454 L 1060 446 C 1060 454, 1048 460, 1031 460 L 49 460 C 32 460, 20 454, 20 446 Z" fill="#475569" />

      <rect x="20" y="20" width="1040" height="440" fill="url(#tile-pattern)" rx={16} stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="20" y="20" width="1040" height="440" fill="none" stroke="#94a3b8" strokeWidth="2.5" rx={16} style={{ pointerEvents: 'none' }} opacity="0.6" />

      {renderMiniPlanter(60, 42)}
      {renderMiniPlanter(400, 42)}
      {renderMiniPlanter(680, 42)}
      {renderMiniPlanter(1020, 42)}
      {renderMiniPlanter(420, 318)}
      {renderMiniPlanter(660, 318)}

      <g className="scenic-guarita" onClick={() => onSpaceSelect(getSpaceById('guarita'))} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
        <ellipse cx="90" cy="390" rx="20" ry="10" fill="rgba(13,37,68,0.12)" />
        <polygon points="70,354 90,368 90,390 70,376" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
        <polygon points="90,368 110,354 110,376 90,390" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
        <polygon points="75,372 85,379 85,364 75,357" fill="#475569" />
        <polygon points="95,364 105,357 105,366 95,373" fill="#e2e8f0" />
        <polygon points="90,340 114,354 90,368 66,354" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
        <polygon points="66,354 90,368 90,366 66,352" fill="#f97316" />
        <polygon points="90,368 114,354 114,352 90,366" fill="#f97316" opacity="0.8" />
        <line x1="102" y1="379" x2="140" y2="354" stroke="#ef4444" strokeWidth="2.5" />
        <line x1="102" y1="379" x2="140" y2="354" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="5 5" />
        <ellipse cx="102" cy="381" rx="3.5" ry="2" fill="#475569" />
        
        <g transform="translate(90, 289)">
          <rect x="-32" y="-11" width="64" height="18" rx="4" fill="#0d2544" />
          <text x="0" y="1" fill="#ffffff" fontSize="7.5px" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">🧭 GUARITA</text>
          <line x1="0" y1="7" x2="0" y2="74" stroke="#0d2544" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
          <circle cx="0" cy="74" r="1.5" fill="#0d2544" opacity="0.5" />
        </g>
      </g>

      <g className="scenic-banheiros" onClick={() => onSpaceSelect(getSpaceById('banheiros'))} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
        <ellipse cx="800" cy="139" rx="22" ry="11" fill="rgba(13,37,68,0.12)" />
        <polygon points="776,105 800,117 800,139 776,127" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
        <polygon points="800,117 824,105 824,127 800,139" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
        <polygon points="800,93 828,105 800,117 772,105" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
        <polygon points="772,105 800,117 800,115 772,103" fill="#475569" />
        <polygon points="800,117 828,105 828,103 800,115" fill="#475569" opacity="0.8" />
        
        <g transform="translate(800, 45)">
          <rect x="-40" y="-11" width="80" height="18" rx="4" fill="#77092a" />
          <text x="0" y="1" fill="#ffffff" fontSize="7.5px" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">🚻 BANHEIROS</text>
          <line x1="0" y1="7" x2="0" y2="60" stroke="#77092a" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
          <circle cx="0" cy="60" r="1.5" fill="#77092a" opacity="0.5" />
        </g>
      </g>

      {roomCoordinates.map(renderIsometricRoom)}
    </svg>
  );
}
