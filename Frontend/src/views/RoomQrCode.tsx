import { QRCodeSVG } from 'qrcode.react';

interface RoomQrCodeProps {
  roomCode: string;
}

export function RoomQrCode({ roomCode }: RoomQrCodeProps) {
  const joinUrl = `${window.location.origin}/room?id=${encodeURIComponent(roomCode)}`;

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        padding: '14px',
        borderRadius: '14px',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',

      }}
    >
      <div
        style={{
          background: '#ffffff',
          padding: '10px',
          borderRadius: '10px',
          lineHeight: 0,
        }}
      >
        <QRCodeSVG value={joinUrl} size={300} level="L" />
      </div>

      <span style={{ fontSize: '20px', color: '#ddd', textAlign: 'center' }}>
        Zeskanuj telefonem, aby dołączyć
      </span>
    </div>
  );
}