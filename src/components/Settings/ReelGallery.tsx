import React, { useState } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Text,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useGradesStore } from "@/stores/grades";
import GradeModal from "../Grades/GradeModal";
import { Reel } from "@/services/shared/Reel";

interface ReelModalProps {
  reel: Reel;
  visible: boolean;
  onClose: () => void;
}


// Components
const GradeIndicator = ({ value, outOf }: { value: number; outOf: number }) => (
  <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
    <Text style={styles.scoreText}>{value.toFixed(2)}</Text>
    <Text style={styles.maxScoreText}>/{outOf}</Text>
  </View>
);

const SubjectBadge = ({ emoji, color }: { emoji: string; color: string }) => (
  <View style={[styles.subjectBadge, { backgroundColor: color + "80" }]}>
    <Text style={styles.emojiText}>{emoji}</Text>
  </View>
);

const ReelThumbnail = ({ reel, onPress }: { reel: Reel; onPress: () => void }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <Image
        source={{ uri: `data:image/jpeg;base64,${reel.imagewithouteffect}` }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={[styles.infoContainer, { backgroundColor: colors.card }]}>
        <SubjectBadge
          emoji={reel.subjectdata.emoji}
          color={reel.subjectdata.color}
        />
        <GradeIndicator
          value={Number(Number(reel.grade.value).toFixed(2))}
          outOf={Number(reel.grade.outOf)}
        />
      </View>
    </TouchableOpacity>
  );
};

interface ReelGalleryProps {
  reels: Reel[];
}

const ReelGallery = ({ reels }: ReelGalleryProps) => {
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

  const deleteReel = (reelId: string) => {
    useGradesStore.setState((store) => {
      const updatedReels = { ...store.reels };
      delete updatedReels[reelId];
      return { reels: updatedReels };
    });
    setSelectedReel(null);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.galleryContent}>
          {reels.map((reel) => (
            <ReelThumbnail
              key={reel.id}
              reel={reel}
              onPress={() => setSelectedReel(reel)}
            />
          ))}
        </View>
      </View>

      {selectedReel && (
        <GradeModal
          isVisible={!!selectedReel}
          imageBase64={selectedReel.image}
          onClose={() => setSelectedReel(null)}
          DeleteGrade={() => deleteReel(selectedReel.id)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  galleryContent: {
    width: "100%",
    maxWidth: 500, // Largeur maximale pour le contenu
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  item: {
    width: 160, // Largeur fixe pour chaque item
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    transform: [{ scaleX: -1 }],
  },
  infoContainer: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    padding: 5,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subjectBadge: {
    borderRadius: 100,
    padding: 5,
  },
  emojiText: {
    fontSize: 20,
  },
  scoreText: {
    fontWeight: "700",
    color: "#000000",
    fontSize: 18,
  },
  maxScoreText: {
    fontWeight: "300",
    color: "#000000",
  },
});

export default ReelGallery;