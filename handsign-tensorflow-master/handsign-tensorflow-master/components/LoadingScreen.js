import React, { useEffect, useState } from "react"
import { Box, Text, VStack, Progress, Heading } from "@chakra-ui/react"
import { motion } from "framer-motion"

const LoadingScreen = ({ progress }) => {
  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="white"
      zIndex="9999"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={8} width="80%" maxW="500px">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Heading
            as="h1"
            size="md"
            color="black"
            fontWeight="600"
            textAlign="center"
            letterSpacing="-0.02em"
          >
            Loading desktop model for optimal experience…
          </Heading>
        </motion.div>

        <VStack spacing={3} width="100%">
          <Box width="100%" height="4px" bg="gray.100" borderRadius="full" overflow="hidden">
            <motion.div
              style={{
                height: "100%",
                background: "black",
                width: `${progress}%`,
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </Box>
          <Text
            fontSize="sm"
            color="black"
            fontWeight="bold"
            fontFamily="'Montserrat', sans-serif"
          >
            {Math.round(progress)}%
          </Text>
        </VStack>

        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="0.2em">
            Powering AI Engine
          </Text>
        </motion.div>
      </VStack>
    </Box>
  )
}

export default LoadingScreen
