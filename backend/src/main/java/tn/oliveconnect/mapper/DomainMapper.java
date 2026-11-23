package tn.oliveconnect.mapper;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;
import tn.oliveconnect.dto.AlertRequest;
import tn.oliveconnect.dto.HarvestRequest;
import tn.oliveconnect.dto.OrchardRequest;
import tn.oliveconnect.dto.PressReceiptRequest;
import tn.oliveconnect.dto.ResourceRequest;
import tn.oliveconnect.dto.TourAssignRequest;
import tn.oliveconnect.dto.TourRequest;
import tn.oliveconnect.entity.Alert;
import tn.oliveconnect.entity.Harvest;
import tn.oliveconnect.entity.HarvestStatus;
import tn.oliveconnect.entity.Orchard;
import tn.oliveconnect.entity.Plot;
import tn.oliveconnect.entity.PressReceipt;
import tn.oliveconnect.entity.Resource;
import tn.oliveconnect.entity.ResourceStatus;
import tn.oliveconnect.entity.Tour;
import tn.oliveconnect.entity.TourStatus;

@Component
public class DomainMapper {

  public Orchard toEntity(OrchardRequest request, String farmerId) {
    List<Plot> plots = new ArrayList<>();
    if (request.getPlots() != null) {
      for (Plot source : request.getPlots()) {
        String plotId = source.getPlotId() == null || source.getPlotId().isBlank()
            ? "plot-" + UUID.randomUUID()
            : source.getPlotId();
        plots.add(new Plot(plotId, source.getName(), source.getAreaHa()));
      }
    }
    return Orchard.builder()
        .farmerId(farmerId)
        .name(request.getName())
        .geometry(request.getGeometry())
        .areaHa(request.getAreaHa())
        .variety(request.getVariety())
        .plots(plots)
        .build();
  }

  public Harvest toEntity(HarvestRequest request, String farmerId) {
    return Harvest.builder()
        .orchardId(request.getOrchardId())
        .farmerId(farmerId)
        .type(request.getType())
        .status(HarvestStatus.REQUESTED)
        .requestedDate(request.getRequestedDate())
        .notes(request.getNotes())
        .build();
  }

  public Alert toEntity(AlertRequest request, String farmerId) {
    return Alert.builder()
        .orchardId(request.getOrchardId())
        .farmerId(farmerId)
        .type(request.getType())
        .description(request.getDescription())
        .location(request.getLocation())
        .build();
  }

  public Tour toEntity(TourRequest request, String code) {
    return Tour.builder()
        .code(code)
        .plannedDate(request.getPlannedDate())
        .teamLeaderId(request.getTeamLeaderId())
        .status(TourStatus.PLANNED)
        .harvestIds(request.getHarvestIds() == null ? new ArrayList<>() : new ArrayList<>(request.getHarvestIds()))
        .resourceIds(request.getResourceIds() == null ? new ArrayList<>() : new ArrayList<>(request.getResourceIds()))
        .build();
  }

  public Tour toEntity(TourAssignRequest request, String harvestId, String code) {
    return Tour.builder()
        .code(code)
        .plannedDate(request.getPlannedDate())
        .teamLeaderId(request.getTeamLeaderId())
        .status(TourStatus.PLANNED)
        .harvestIds(new ArrayList<>(List.of(harvestId)))
        .resourceIds(request.getResourceIds() == null ? new ArrayList<>() : new ArrayList<>(request.getResourceIds()))
        .build();
  }

  public Resource toEntity(ResourceRequest request) {
    return Resource.builder()
        .type(request.getType())
        .name(request.getName())
        .capacity(request.getCapacity())
        .availableFrom(request.getAvailableFrom() == null ? Instant.now() : request.getAvailableFrom())
        .availableTo(request.getAvailableTo())
        .status(request.getStatus() == null ? ResourceStatus.AVAILABLE : request.getStatus())
        .build();
  }

  public PressReceipt toEntity(PressReceiptRequest request, String pressId, String receivedBy) {
    return PressReceipt.builder()
        .harvestId(request.getHarvestId())
        .pressId(pressId)
        .weightKg(request.getWeightKg())
        .qualityGrade(request.getQualityGrade())
        .receivedAt(request.getReceivedAt() == null ? Instant.now() : request.getReceivedAt())
        .receivedBy(receivedBy)
        .build();
  }
}
