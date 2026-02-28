import React, { useRef, useState, useEffect } from "react"
import * as tf from "@tensorflow/tfjs"
import * as handpose from "@tensorflow-models/handpose"
import Webcam from "react-webcam"
import { drawHand } from "../components/handposeutil"
import * as fp from "fingerpose"
import Handsigns from "../components/handsigns"

import About from "../components/about"
import Metatags from "../components/metatags"
import {
  Text,
  Heading,
  Button,
  Image,
  Stack,
  Container,
  Box,
  VStack,
  ChakraProvider,
  HStack,
  Divider,
  Center,
} from "@chakra-ui/react"
import LoadingScreen from "../components/LoadingScreen"
import { AnimatePresence, motion } from "framer-motion"
import { RiCameraFill, RiCameraOffFill } from "react-icons/ri"

export default function Home() {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)

  const [camState, setCamState] = useState("on")
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [typedText, setTypedText] = useState("")
  const [currentGesture, setCurrentGesture] = useState(null)

  const lastConfirmedGesture = useRef(null)
  const smoothingBuffer = useRef([])

  async function runHandpose() {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev < 90) return prev + Math.random() * 5
        return prev
      })
    }, 200)

    const net = await handpose.load()
    clearInterval(progressInterval)
    setLoadingProgress(100)

    setTimeout(() => {
      setIsLoading(false)
    }, 500)

    setInterval(() => {
      detect(net)
    }, 100)
  }

  async function detect(net) {
    // Check data is available
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video
      const videoWidth = webcamRef.current.video.videoWidth
      const videoHeight = webcamRef.current.video.videoHeight

      // Set video width
      webcamRef.current.video.width = videoWidth
      webcamRef.current.video.height = videoHeight

      // Set canvas height and width
      canvasRef.current.width = videoWidth
      canvasRef.current.height = videoHeight

      // Make Detections
      const hand = await net.estimateHands(video)

      if (hand.length > 0) {
        const GE = new fp.GestureEstimator([
          Handsigns.aSign, Handsigns.bSign, Handsigns.cSign, Handsigns.dSign,
          Handsigns.eSign, Handsigns.fSign, Handsigns.gSign, Handsigns.hSign,
          Handsigns.iSign, Handsigns.jSign, Handsigns.kSign, Handsigns.lSign,
          Handsigns.mSign, Handsigns.nSign, Handsigns.oSign, Handsigns.pSign,
          Handsigns.qSign, Handsigns.rSign, Handsigns.sSign, Handsigns.tSign,
          Handsigns.uSign, Handsigns.vSign, Handsigns.wSign, Handsigns.xSign,
          Handsigns.ySign, Handsigns.zSign,
        ])

        const estimatedGestures = await GE.estimate(hand[0].landmarks, 8.5)

        if (estimatedGestures.gestures && estimatedGestures.gestures.length > 0) {
          const confidence = estimatedGestures.gestures.map(p => p.confidence)
          const maxConfidence = confidence.indexOf(Math.max.apply(undefined, confidence))
          const rawGesture = estimatedGestures.gestures[maxConfidence].name

          // Smoothing (Debouncing)
          smoothingBuffer.current.push(rawGesture)
          if (smoothingBuffer.current.length > 5) smoothingBuffer.current.shift()

          const mostFrequent = smoothingBuffer.current.reduce((a, b, i, arr) =>
            (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b)
            , smoothingBuffer.current[0])

          const mostFrequentCount = smoothingBuffer.current.filter(v => v === mostFrequent).length

          setCurrentGesture(mostFrequent)

          // Stable Logic (wait for 3-5 frames)
          if (smoothingBuffer.current.length === 5 && mostFrequentCount >= 4) {
            if (mostFrequent === lastConfirmedGesture.current) {
              // Already typed this specific gesture, wait for change or clear
            } else {
              // New stable gesture detected! Add instantly
              setTypedText(prev => prev + mostFrequent.toUpperCase())
              lastConfirmedGesture.current = mostFrequent
            }
          }
        } else {
          smoothingBuffer.current = []
          setCurrentGesture(null)
          lastConfirmedGesture.current = null // Reset so next gesture can be typed
        }
      } else {
        smoothingBuffer.current = []
        setCurrentGesture(null)
        lastConfirmedGesture.current = null // Reset on hand loss
      }

      // Draw hand lines
      const ctx = canvasRef.current.getContext("2d")
      drawHand(hand, ctx)
    }
  }

  //   if (sign) {
  //     console.log(sign, Signimage[sign])
  //   }

  useEffect(() => {
    runHandpose()
  }, [])

  function turnOffCamera() {
    if (camState === "on") {
      setCamState("off")
    } else {
      setCamState("on")
    }
  }

  function addSpace() {
    setTypedText(prev => prev + " ")
  }

  function backspace() {
    setTypedText(prev => prev.slice(0, -1))
  }

  return (
    <ChakraProvider>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000 }}
          >
            <LoadingScreen progress={loadingProgress} />
          </motion.div>
        )}
      </AnimatePresence>

      <Metatags />
      <Box bgColor="#f8f9fa" minH="100vh" display="flex" flexDirection="column" fontFamily="'Montserrat', sans-serif">
        <Container centerContent maxW="xl" flex="1" pt="6" position="relative">
          <Box
            id="webcam-container"
            borderRadius="3xl"
            overflow="hidden"
            boxShadow="0 20px 50px rgba(0,0,0,0.1)"
            mb="4"
            width="100%"
            maxW="500px"
          >
            {camState === "on" ? (
              <Webcam id="webcam" ref={webcamRef} />
            ) : (
              <Box id="webcam" bg="gray.900" display="flex" alignItems="center" justifyContent="center">
                <Text color="white" fontWeight="600">Camera Paused</Text>
              </Box>
            )}
          </Box>
          <canvas id="gesture-canvas" ref={canvasRef} />

          {/* Typing Interface - Redesigned for Center-Bottom focus */}
          <VStack
            position="absolute"
            bottom="40px"
            left="50%"
            transform="translateX(-50%)"
            width="90%"
            maxW="460px"
            spacing={4}
            zIndex="20"
          >
            <Box
              width="100%"
              bg="white"
              p="6"
              borderRadius="2xl"
              boxShadow="0 10px 30px rgba(0,0,0,0.05)"
              border="1px solid"
              borderColor="gray.100"
            >
              <Box
                minH="70px"
                p="3"
                bg="gray.50"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
              >
                <Text
                  fontSize="2xl"
                  fontWeight="700"
                  color="black"
                  fontFamily="'Poppins', sans-serif"
                  textAlign="center"
                  letterSpacing="-0.01em"
                >
                  {typedText}
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                    style={{
                      marginLeft: "2px",
                      fontWeight: "400",
                      color: "#adb5bd"
                    }}
                  >
                    |
                  </motion.span>
                </Text>
              </Box>

              <HStack spacing={3} mt="4">
                <Button
                  size="lg"
                  flex="2"
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  onClick={addSpace}
                  borderRadius="xl"
                  fontWeight="600"
                >
                  Space
                </Button>
                <Button
                  size="lg"
                  flex="1"
                  colorScheme="red"
                  variant="ghost"
                  onClick={backspace}
                  borderRadius="xl"
                  fontWeight="600"
                >
                  Delete
                </Button>
              </HStack>
            </Box>

            {/* Removed Current Gesture feedback for ultra-clean UI */}
          </VStack>
        </Container>

        <Box p="4" bg="white" borderTop="1px solid" borderColor="gray.100">
          <Center>
            <HStack spacing={6}>
              <Button
                leftIcon={camState === "on" ? <RiCameraFill /> : <RiCameraOffFill />}
                onClick={turnOffCamera}
                variant="ghost"
                size="sm"
                color="gray.600"
                _hover={{ color: "black" }}
              >
                Camera
              </Button>
              <Divider orientation="vertical" height="15px" />
              <About />
            </HStack>
          </Center>
        </Box>
      </Box>
    </ChakraProvider>
  )
}
