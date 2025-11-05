"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
  className?: string
}

export function QRScanner({ onScan, onError, className }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerElementId = "qr-reader"

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current && isScanning) {
        stopScanning()
      }
    }
  }, [isScanning])

  async function startScanning() {
    try {
      setError(null)

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop()) // Stop the test stream
      setHasPermission(true)

      // Initialize scanner
      const scanner = new Html5Qrcode(scannerElementId)
      scannerRef.current = scanner

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      await scanner.start(
        { facingMode: "environment" }, // Use back camera
        config,
        (decodedText) => {
          // Success callback
          onScan(decodedText)
        },
        (errorMessage) => {
          // Error callback (called frequently, ignore most)
          // console.log("Scan error:", errorMessage)
        }
      )

      setIsScanning(true)
    } catch (err: any) {
      console.error("Scanner error:", err)
      const errorMsg =
        err.name === "NotAllowedError"
          ? "Permissão de câmera negada. Por favor, permita o acesso à câmera."
          : err.name === "NotFoundError"
          ? "Nenhuma câmera encontrada no dispositivo."
          : "Erro ao iniciar câmera. Tente novamente."

      setError(errorMsg)
      setHasPermission(false)
      if (onError) onError(errorMsg)
    }
  }

  async function stopScanning() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
        scannerRef.current = null
      }
      setIsScanning(false)
    } catch (err) {
      console.error("Error stopping scanner:", err)
    }
  }

  function toggleScanning() {
    if (isScanning) {
      stopScanning()
    } else {
      startScanning()
    }
  }

  return (
    <div className={className}>
      {/* Scanner Container */}
      <div className="relative rounded-lg overflow-hidden bg-muted">
        <div
          id={scannerElementId}
          className={`${isScanning ? "block" : "hidden"}`}
          style={{ width: "100%", minHeight: "300px" }}
        />

        {/* Placeholder when not scanning */}
        {!isScanning && (
          <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground mb-4">
              Clique no botão abaixo para iniciar o scanner
            </p>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && hasPermission === false && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className="mt-4 flex justify-center">
        <Button onClick={toggleScanning} size="lg">
          {isScanning ? (
            <>
              <CameraOff className="h-5 w-5 mr-2" />
              Parar Scanner
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 mr-2" />
              Iniciar Scanner
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      {isScanning && (
        <p className="text-sm text-center text-muted-foreground mt-4">
          Aponte a câmera para o QR code do ingresso
        </p>
      )}
    </div>
  )
}
